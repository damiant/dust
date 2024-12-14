import { Component, WritableSignal, effect, signal, viewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonContent,
  IonIcon,
  IonSpinner,
  IonText,
  ToastController,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { PinEntryComponent } from '../pin-entry/pin-entry.component';
import { Router, RouterModule } from '@angular/router';
import { DbService } from '../data/db.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { SettingsService } from '../data/settings.service';
import { FavoritesService } from '../favs/favorites.service';
import { MessageComponent } from '../message/message.component';
import { addDays, daysUntil, delay, isWhiteSpace, now } from '../utils/utils';
import { Dataset, DatasetFilter } from '../data/models';
import { ApiService, SendResult } from '../data/api.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { ThemePrimaryColor, UiService } from '../ui/ui.service';
import { environment } from 'src/environments/environment';
import { Network } from '@capacitor/network';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, chevronUpCircleSharp, chevronUpOutline, cloudDownloadOutline } from 'ionicons/icons';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { CarouselComponent, SlideSelect } from '../carousel/carousel.component';
import { CarouselItemComponent } from '../carousel-item/carousel-item.component';
import { UpdateService } from '../update.service';
import { ShareInfoType, ShareService } from '../share/share.service';
import { BurnCardComponent } from '../burn-card/burn-card.component';
import { BarComponent } from '../bar/bar.component';

interface IntroState {
  ready: boolean;
  showMessage: boolean;
  downloading: boolean;
  showPinModal: boolean;
  pinPromise: Promise<boolean> | undefined;
  eventAlreadySelected: boolean;
  cards: Dataset[];
  selected: Dataset | undefined;
  message: string;
  cardLoaded: any;
  clearCount: number;
  scrollLeft: number;
  list: boolean;
  enableCarousel: boolean;
  showing: DatasetFilter;
}

function initialState(): IntroState {
  return {
    ready: true,
    showMessage: false,
    downloading: false,
    showPinModal: false,
    eventAlreadySelected: true,
    cards: [],
    selected: undefined,
    message: '',
    enableCarousel: false,
    pinPromise: undefined,
    cardLoaded: {},
    clearCount: 0,
    scrollLeft: 0,
    list: false,
    showing: 'all',
  };
}

@Component({
  selector: 'app-intro',
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
  imports: [
    IonFabButton,
    IonFab,
    CommonModule,
    FormsModule,
    RouterModule,
    MessageComponent,
    IonButton,
    IonSpinner,
    IonIcon,
    IonText,
    IonContent,
    CachedImgComponent,
    CarouselComponent,
    CarouselItemComponent,
    PinEntryComponent,
    BurnCardComponent,
    BarComponent,
  ]
})
export class IntroPage {
  private db = inject(DbService);
  private api = inject(ApiService);
  private settingsService = inject(SettingsService);
  private ui = inject(UiService);
  private fav = inject(FavoritesService);
  private updateService = inject(UpdateService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private shareService = inject(ShareService);
  private pinEntry = viewChild.required(PinEntryComponent);
  private _change = inject(ChangeDetectorRef);
  isFiltered = false;
  vm: IntroState = initialState();
  download: WritableSignal<string> = signal('');
  subtitle: WritableSignal<string> = signal('');
  carousel = viewChild(CarouselComponent);

  constructor() {
    addIcons({ arrowForwardOutline, chevronUpOutline, chevronUpCircleSharp, cloudDownloadOutline });
    effect(() => {
      const downloading = this.download();
      if (downloading !== '') {
        //this.ui.presentDarkToast(`Downloading ${downloading}`, this.toastController);
      }
      this._change.markForCheck();
    });
    effect(async () => {
      const shareItem = this.shareService.hasShare();
      if (shareItem.type == ShareInfoType.preview) {
        this.db.overrideDataset = shareItem.id;
        await this.ionViewWillEnter();
        await this.ionViewDidEnter();
      }
    });
  }

  ionViewWillLeave() {
    this.vm.enableCarousel = false;
  }

  async ionViewWillEnter() {
    const cardLoaded = structuredClone(this.vm.cardLoaded);
    this.vm = initialState();
    this.vm.list = this.settingsService.settings.list;
    this.vm.cardLoaded = cardLoaded;
    this.vm.showing = this.settingsService.settings.datasetFilter ?? 'all';
    // Whether the user has selected an event already
    this.vm.eventAlreadySelected =
      !isWhiteSpace(this.settingsService.settings.datasetId) && !this.settingsService.settings.preventAutoStart;
    console.log(`eventAlreadySelected ${this.vm.eventAlreadySelected} prevAuto=${this.settingsService.settings.preventAutoStart} ${JSON.stringify(this.settingsService.settings.datasetId)} ${isWhiteSpace(this.settingsService.settings.datasetId)}`)
    if (this.settingsService.settings.dataset) {
      const end = new Date(this.settingsService.settings.dataset.end);
      const until = daysUntil(end, now());
      if (until < -30) {
        // event has already ended. We shouldn't auto start
        console.warn(`Event ended ${Math.abs(until)} days ago. Not opening automatically.`);
        this.vm.eventAlreadySelected = false;
      }
    }

    this.vm.downloading = true;
    // Get Cached Values
    this.vm.cards = await this.api.loadDatasets(this.vm.showing, undefined, true);
    // Get Live Values (ie if updated)
    this.vm.cards = await this.api.loadDatasets(this.vm.showing);
    if (this.vm.cards.length == 0) {
      this.vm.message = `Check your network connection and try starting again.`;
      this.vm.showMessage = true;
      this._change.markForCheck();
      return;
    }
    this.vm.downloading = false;
    const idx = this.vm.cards.findIndex((c) => this.api.datasetId(c) == this.settingsService.settings.datasetId);
    if (idx >= 0) {
      this.vm.selected = this.vm.cards[idx];
      this.subtitle.set(this.vm.selected.subTitle);
      if (this.carousel()) {
        this.carousel()!.setScrollLeft(this.settingsService.settings.scrollLeft);
      }
    }
    const preview = this.db.overrideDataset;
    this._change.markForCheck();
    if (preview) {
      const all = await this.api.loadDatasets(this.vm.showing, true);
      console.info('overriding preview', preview);
      //await this.db.clear();
      const found = all.find((d) => d.name == preview);
      if (!found) {
        console.error(`${preview} not found in [${all.map((c) => c.name).join(',')}]`);
        return;
      }
      let p: Dataset = JSON.parse(JSON.stringify(found));
      this.settingsService.settings.dataset = p;
      this.settingsService.settings.datasetId = p.id;
      this.settingsService.settings.eventTitle = p.title;
      this.vm.eventAlreadySelected = true;
      this.vm.selected = p;
      this.subtitle.set(this.vm.selected.subTitle);
    }
  }

  async selectedFilter(v: string) {
    if (!v) {
      this._change.markForCheck();
      return;
    }
    this.vm.scrollLeft = 0;
    this.vm.selected = undefined;
    this.vm.showing = v as DatasetFilter;
    this.subtitle.set('');
    this.vm.cards = await this.api.loadDatasets(v as DatasetFilter);
    this.settingsService.settings.datasetFilter = v as DatasetFilter;
    this.settingsService.save();
    if (this.carousel()) {
      this.carousel()!.setScrollLeft(0);
    }
    this._change.markForCheck();
  }

  async toggleList() {    
    this.vm.list = !this.vm.list;
    this.settingsService.settings.list = this.vm.list;
    this.settingsService.save();
    this._change.markForCheck();
  }  

  async ionViewDidEnter() {
    this.vm.enableCarousel = true;
    this.ui.setNavigationBar(ThemePrimaryColor);
    await delay(500);
    if (Capacitor.isNativePlatform()) {
      await StatusBar.setStyle({ style: Style.Dark });
      await this.ui.setStatusBarBackgroundColor();
      await SplashScreen.hide();
      await delay(200);
      await this.ui.setStatusBarBackgroundColor();
    }

    if (this.vm.eventAlreadySelected) {
      console.log(`Auto starting = ${this.vm.eventAlreadySelected}...`);
      this._change.markForCheck();
      await this.go();
    } else {
      console.log('Did not auto start');
      // We are not auto starting with an event. We'll check versions (without await)
      this.updateService.checkVersion(this.alertController);
    }
    this._change.markForCheck();
  }

  public async clear() {
    this.vm.clearCount++;
    if (this.vm.clearCount < 5) {
      return;
    }
    await this.db.clear();
    console.log('Done clearing');
    this.settingsService.clearSelectedEvent();
    this.settingsService.save();
    document.location.href = '';
  }

  async preDownload() {
    try {
      if (this.api.hasStarted(this.vm.selected!)) {
        const status = await Network.getStatus();
        if (status.connectionType == 'cellular') {
          const hasEverDownloaded = await this.api.hasEverDownloaded(this.vm.selected!);
          if (hasEverDownloaded) {
            console.log(`Avoiding downloading because event has started and we are on cell service`);
            return;
          } else {
            // We are forced to download because we have never downloaded this event
          }
        }
      }

      this.vm.downloading = true;
      // If we are using a preview then force
      const forceDownload = !!this.db.overrideDataset;
      await this.api.download(this.vm.selected, forceDownload, this.download);

      // Need to save this otherwise it will think we cant start this event
      this.settingsService.setOffline(this.settingsService.settings.datasetId);
      this.settingsService.save();

    } finally {
      this.vm.downloading = false;
      this.download.set('');
    }
  }

  async go() {
    if (this.vm.eventAlreadySelected && !this.vm.selected) {
      this.vm.eventAlreadySelected = false;
      console.error(
        'We should not get into this state but just in case we have bad state data we need to have the user select the event',
      );
    }
    if (!this.vm.selected) return;
    this.vm.selected.class = 'launching';

    // If event has started (hasStarted)
    // and network is cell
    await this.preDownload();
    if (!isWhiteSpace(this.vm.selected.pin)) {
      if (!await this.verifyPin()) {
        this.settingsService.settings.preventAutoStart = false;
        this.vm.eventAlreadySelected = false;
        this.settingsService.save();
        return;
      }
    }

    /*  We now predownload the data instead  
        try {
          this.vm.downloading = true;
          // If we are using a preview then force
          const forceDownload = !!this.db.overrideDataset;
          await this.api.download(this.vm.selected, forceDownload, this.download);
        } finally {
          this.vm.downloading = false;
          this.download.set('');
        }
          */

    const start = new Date(this.vm.selected.start);
    const manBurns = addDays(start, 6);
    const x = daysUntil(manBurns, now());
    const until = daysUntil(start, now());

    let hideArtLocations = until > 1 && this.settingsService.isBurningMan();
    let hideCampLocations = until > 7 && this.settingsService.isBurningMan();
    if (environment.overrideLocations) {
      hideArtLocations = false;
      hideCampLocations = false;
      console.error('Overriding hiding locations');
    }
    console.debug(`Event starts ${start}, today is ${now()} and there are ${until} days until then`);
    this.db.setLocationHidden({
      art: hideArtLocations,
      camps: hideCampLocations,
      artMessage: 'Location available August 25',
      campMessage: 'Location available August 18'
    });

    if ((hideArtLocations || hideCampLocations) && !this.vm.eventAlreadySelected && this.settingsService.shouldAboutAlert()) {
      if (x < 80) {
        this.vm.message = `Locations for camps and art will be released in the app shortly before gates open. There are ${x} days until the man burns.`;
      } else {
        this.vm.message = `Camps, Art and Events will be released in the app closer to the event. There are ${x} days until the man burns.`;
      }
      this.settingsService.setLastAboutAlert();
      this.vm.showMessage = true;
      this._change.detectChanges();
    } else {
      this.vm.showMessage = false;
      await this.launch();
    }
  }

  async launch(attempt: number = 1) {
    try {
      if (!this.vm.selected) return;
      this.db.selectedDataset.set(this.vm.selected);
      let showYear = `${new Date().getFullYear()}` !== this.vm.selected.year && this.vm.selected.year !== '0000';
      const title = showYear ? this.vm.selected.year : '';
      this.db.selectedYear.set(title);
      const hasOffline = this.settingsService.isOffline(this.settingsService.settings.datasetId);
      if (!hasOffline) {
        const status = await Network.getStatus();
        if (!status.connected) {
          this.ui.presentDarkToast(
            'You are offline: This event needs to be downloaded before you can view it.',
            this.toastController,
          );
          this.vm.eventAlreadySelected = false;
          this.open(this.vm.cards[0]);
          return;
        }
      }
      this.vm.ready = false;
      this.vm.showMessage = false;
      this._change.detectChanges();

      console.warn(`populate ${this.settingsService.settings.datasetId} attempt ${attempt}`);
      let result = await this.db.populate(this.settingsService.settings.datasetId, this.db.getTimeZone());
      await this.db.getWorkerLogs();
      const sendResult: SendResult = await this.api.sendDataToWorker(
        result.revision,
        this.db.getLocationsHidden(),
        this.settingsService.isBurningMan(),
      );
      if (sendResult.datasetResult) {
        // We downloaded a new dataset
        result = sendResult.datasetResult;
      }
      if (!sendResult.success) {
        // Its a mess
        await this.cleanup();
        // It does not matter if we were able to cleanup the dataset by downloading again, we need to exit to relaunch
        if (attempt == 1) {
          this.launch(attempt + 1);
        }
        return;
      }
      this.fav.init(this.settingsService.settings.datasetId);

      const hidden = [];
      // Hide music if there is none
      if (result.rsl == 0) {
        hidden.push('rsl');
      }
      if (result.art == 0) {
        hidden.push('art');
      }
      if (!this.settingsService.isBurningMan()) {
        hidden.push('friends');
        //hidden.push('private');
      }
      if (`${this.settingsService.settings.dataset?.mastodonHandle}`.length == 0 && this.settingsService.settings.dataset?.inboxEmail !== 'Y') {
        hidden.push('messages');
      }
      this.db.featuresHidden.set(hidden);
      this.settingsService.setOffline(this.settingsService.settings.datasetId);

      this.settingsService.settings.preventAutoStart = false;
      this.vm.eventAlreadySelected = false;

      this.settingsService.save();
      this.ui.setStatusBarBasedOnTheme();
      this.db.overrideDataset = undefined;
      await this.router.navigateByUrl('/tabs/profile');
    } finally {
      setTimeout(() => {
        this.vm.ready = true;
        this._change.detectChanges();
      }, 2000);
    }
  }

  async cleanup(): Promise<boolean> {
    console.error(`Redownloading...`);
    let success = true;
    try {
      this.vm.downloading = true;
      await this.api.download(this.vm.selected, true, this.download);
    } catch {
      success = false;
    } finally {
      this.vm.downloading = false;
    }
    this.vm.eventAlreadySelected = false; // Show intro page
    return success;
  }

  open(card: Dataset, isClick?: boolean) {
    if (isClick && this.vm.selected && this.vm.selected.id == card.id) {
      // Already selected so treat it like you pressed get dusty button
      if (this.vm.ready) {
        this.go();
      }
      return;
    }
    this.vm.selected = card;
    this.subtitle.set(this.vm.selected.subTitle);
    this.save();

  }

  slideChanged(slide: SlideSelect) {
    if (!this.vm.ready) return;
    if (slide.index < this.vm.cards.length) {
      this.vm.scrollLeft = slide.scrollLeft;
      this.open(this.vm.cards[slide.index]);
    }
  }

  save() {
    this.settingsService.settings.datasetId = this.api.datasetId(this.vm.selected!);
    this.settingsService.settings.dataset = this.vm.selected;
    this.settingsService.settings.mapRotation = this.settingsService.isBurningMan() ? 45 : -(this.vm.selected!.mapDirection ?? 0); // Burning Mans map is rotate 45 degrees
    this.settingsService.settings.eventTitle = this.vm.selected!.title;
    this.settingsService.settings.scrollLeft = this.vm.scrollLeft;
    this.settingsService.save();
  }

  async verifyPin(): Promise<boolean> {
    if (this.vm.selected && await this.settingsService.pinPassed(this.vm.selected.id, this.vm.selected.pin)) {
      return true;
    };
    this.vm.showPinModal = true;
    this.vm.pinPromise = new Promise<boolean>((resolve) => {
      this.pinEntry().dismissed.subscribe(async (match) => {
        if (match) {
          await this.settingsService.setPin(this.vm.selected!.id, this.vm.selected!.pin);
        }
        this.vm.pinPromise = undefined;
        resolve(match);
      });
    });
    return this.vm.pinPromise;
  }

  async closePin() {
    this.vm.showPinModal = false;

  }
}