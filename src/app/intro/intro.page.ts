import { Component, ViewChild, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonIcon, IonSpinner, IonText, ToastController } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { DbService } from '../data/db.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { SettingsService } from '../data/settings.service';
import { FavoritesService } from '../favs/favorites.service';
import { MessageComponent } from '../message/message.component';
import { addDays, daysUntil, delay, isWhiteSpace, now } from '../utils/utils';
import { Dataset } from '../data/models';
import { ApiService, SendResult } from '../data/api.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { ThemePrimaryColor, UiService } from '../ui/ui.service';
import { environment } from 'src/environments/environment';
import { Network } from '@capacitor/network';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { CarouselComponent, SlideSelect } from '../carousel/carousel.component';
import { CarouselItemComponent } from '../carousel-item/carousel-item.component';

interface IntroState {
  ready: boolean;
  showMessage: boolean;
  downloading: boolean;
  eventAlreadySelected: boolean;
  cards: Dataset[];
  selected: Dataset | undefined;
  message: string;
  clearCount: number;
  scrollLeft: number;
}

function initialState(): IntroState {
  return {
    ready: true,
    showMessage: false,
    downloading: false,
    eventAlreadySelected: true,
    cards: [],
    selected: undefined,
    message: '',
    clearCount: 0,
    scrollLeft: 0
  };
}

@Component({
  selector: 'app-intro',
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
  standalone: true,
  imports: [
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
    CarouselItemComponent
  ],
})
export class IntroPage {
  vm: IntroState = initialState();
  download: WritableSignal<string> = signal('');
  @ViewChild(CarouselComponent) carousel!: CarouselComponent;

  constructor(
    private db: DbService,
    private api: ApiService,
    private settingsService: SettingsService,
    private ui: UiService,
    private fav: FavoritesService,
    private router: Router,
    private toastController: ToastController,
  ) {
    addIcons({ arrowForwardOutline });
    effect(() => {
      const downloading = this.download();
      if (downloading !== '') {
        this.ui.presentDarkToast(
          `Downloading ${downloading}`,
          this.toastController,
        );
      }
    });
  }

  async ionViewWillEnter() {
    this.vm = initialState();
    // Whether the user has selected an event already
    this.vm.eventAlreadySelected = !isWhiteSpace(this.settingsService.settings.datasetId) && !this.settingsService.settings.preventAutoStart;
    if (this.settingsService.settings.dataset) {
      const end = new Date(this.settingsService.settings.dataset.end);
      const until = daysUntil(end, now());
      if (until < 0) {
        // event has already ended. We shouldn't auto start
        console.warn(`Event ended ${Math.abs(until)} days ago. Not opening automatically.`);
        this.vm.eventAlreadySelected = false;
      }
    }

    this.vm.cards = await this.api.loadDatasets();
    // need to load
    await this.load();
  }

  private async load() {
    console.log(`Search for`, this.settingsService.settings.datasetId)
    const idx = this.vm.cards.findIndex((c) => this.api.datasetId(c) == this.settingsService.settings.datasetId);
    if (idx >= 0) {
      this.vm.selected = this.vm.cards[idx];
      this.carousel.setScrollLeft(this.settingsService.settings.scrollLeft);
    }
    const preview = this.db.overrideDataset;
    if (preview) {
      console.info('overriding preview', preview);
      await this.db.clear();
      let p: Dataset = JSON.parse(JSON.stringify(this.vm.cards.find(d => d.name == preview)));
      this.settingsService.settings.dataset = p;
      this.settingsService.settings.datasetId = p.id;
      this.settingsService.settings.eventTitle = p.title;
      this.vm.eventAlreadySelected = true;
      p.title += ' (Preview)';
      this.vm.selected = p;
      console.info(`Dataset selected`, p);
    }
  }


  async ionViewDidEnter() {
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
      await this.go();
    }
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

  async go() {
    if (!this.vm.selected) return;

    try {
      this.vm.downloading = true;
      // If we are using a preview then force
      const forceDownload = !!this.db.overrideDataset;
      await this.api.download(this.vm.selected, forceDownload, this.download);
    } finally {
      this.vm.downloading = false;
      this.download.set('');
    }

    const start = new Date(this.vm.selected.start);
    const manBurns = addDays(start, 6);
    const x = daysUntil(manBurns, now());
    const until = daysUntil(start, now());

    let hideLocations = until > 1 && this.isBurningMan();
    if (environment.overrideLocations) {
      hideLocations = false;
      console.error('Overriding hiding locations');
    }
    console.debug(`Event starts ${start}, today is ${now()} and there are ${until} days until then`);
    this.db.setHideLocations(hideLocations);
    if (hideLocations && !this.vm.eventAlreadySelected) {
      if (x < 50) {
        this.vm.message = `Locations for camps and art will be released in the app when gates open. There are ${x} days until the man burns.`;
      } else {
        this.vm.message = `Camps, Art and Events will be released in the app closer to the event. There are ${x} days until the man burns.`;
      }
      this.vm.showMessage = true;
    } else {
      this.vm.showMessage = false;
      await this.launch();
    }
  }

  isBurningMan() {
    return this.settingsService.settings.datasetId.includes('ttitd');
  }

  async launch(attempt: number = 1) {
    try {
      if (!this.vm.selected) return;

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

      console.warn(`populate ${this.settingsService.settings.datasetId} attempt ${attempt}`);
      let result = await this.db.populate(this.settingsService.settings.datasetId);      
      await this.db.getWorkerLogs();
      const sendResult: SendResult = await this.api.sendDataToWorker(result.revision, this.db.locationsHidden(), this.isBurningMan());
      if (sendResult.datasetResult) {
        // We downloaded a new dataset
        result = sendResult.datasetResult;
      }
      if (!sendResult.success) {
        // Its a mess
        await this.cleanup();
        // It doesnt matter if we were able to cleanup the dataset by downloading again, we need to exit to relaunch
        if (attempt == 1) {
          this.launch(attempt + 1);
        }
        return;
      }
      this.fav.init(this.settingsService.settings.datasetId);
      let showYear = (`${new Date().getFullYear()}` !== this.vm.selected.year) && this.vm.selected.year !== '0000';

      const title = showYear ? this.vm.selected.year : '';
      this.db.selectedYear.set(title);
      this.db.selectedDataset.set(this.vm.selected);

      const hidden = [];
      if (result.rsl == 0) {
        hidden.push('rsl');
      }
      if (!this.isBurningMan()) {
        //hidden.push('rsl');
        hidden.push('art');
        hidden.push('friends');
        hidden.push('private');
      }
      this.db.featuresHidden.set(hidden);
      this.settingsService.setOffline(this.settingsService.settings.datasetId);
      this.settingsService.save();
      this.ui.setStatusBarBasedOnTheme();
      await this.router.navigateByUrl('/tabs/profile');
    } finally {
      setTimeout(() => {
        this.vm.ready = true;
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
    }
    finally {
      this.vm.downloading = false;
    }
    this.vm.eventAlreadySelected = false; // Show intro page
    return success;
  }

  open(card: Dataset) {
    this.vm.selected = card;
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
    this.settingsService.settings.mapRotation = this.isBurningMan() ? 45 : 0; // Burning Mans map is rotate 45 degrees
    this.settingsService.settings.eventTitle = this.vm.selected!.title;
    this.settingsService.settings.scrollLeft = this.vm.scrollLeft;
    this.settingsService.save();
  }
}
