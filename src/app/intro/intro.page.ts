import { Component, WritableSignal, effect, signal } from '@angular/core';
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
import { Directory, Filesystem } from '@capacitor/filesystem';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';

interface IntroState {
  ready: boolean;
  showMessage: boolean;
  downloading: boolean;
  eventAlreadySelected: boolean;
  cards: Dataset[];
  selected: Dataset | undefined;
  message: string;
  clearCount: number;
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
  ],
})
export class IntroPage {
  vm: IntroState = initialState();
  download: WritableSignal<boolean> = signal(false);

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
      if (downloading) {
        this.ui.presentDarkToast(
          `Downloading ${this.vm.selected?.title}`,
          this.toastController,
        );
      }
    });
  }

  async ionViewWillEnter() {
    this.vm = initialState();
    // Whether the user has selected an event already
    this.vm.eventAlreadySelected = !isWhiteSpace(this.settingsService.settings.datasetId);
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
    this.load();
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

    try {
      this.vm.downloading = true;
      await this.api.download(this.vm.selected, false, this.download);
    } finally {
      this.vm.downloading = false;
      this.download.set(false);
    }
    console.log(`Auto starting = ${this.vm.eventAlreadySelected}...`);
    if (this.vm.eventAlreadySelected) {
      this.go();
    }
  }

  private load() {
    const idx = this.vm.cards.findIndex((c) => this.api.datasetId(c) == this.settingsService.settings.datasetId);
    if (idx >= 0) {
      this.vm.selected = this.vm.cards[idx];
    } else {
      // First time in: select this year
      this.vm.selected = this.vm.cards[0];
      this.save();
    }
  }

  public async clear() {
    this.vm.clearCount++;
    if (this.vm.clearCount < 5) {
      return;
    }
    const d = await Filesystem.readdir({ path: '.', directory: Directory.Data });
    for (let file of d.files) {
      console.log(`Delete file ${file.name}`);
      await Filesystem.deleteFile({ path: file.name, directory: Directory.Data });
    }
    await this.db.clearIDB();
    console.log('Done clearing');
    this.settingsService.clearSelectedEvent();
    this.settingsService.settings.lastDownload = '';
    this.settingsService.save();
    document.location.href = '';
  }

  async go() {
    if (!this.vm.selected) return;

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
      this.launch();
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
          this.vm.selected = this.vm.cards[0];
          this.save();
          return;
        }
      }
      this.vm.ready = false;
      this.vm.showMessage = false;

      console.warn(`populate ${this.settingsService.settings.datasetId} attempt ${attempt}`);
      let result = await this.db.init(this.settingsService.settings.datasetId);
      await this.db.getWorkerLogs();
      console.warn(`sendDataToWorker ${this.settingsService.settings.datasetId}`);
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
      console.log(`sendDataToWorker completed`);
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

  save() {
    this.settingsService.settings.datasetId = this.api.datasetId(this.vm.selected!);
    this.settingsService.settings.dataset = this.vm.selected;
    this.settingsService.settings.mapRotation = this.isBurningMan() ? 45 : 0; // Burning Mans map is rotate 45 degrees
    this.settingsService.settings.eventTitle = this.vm.selected!.title;
    this.settingsService.save();
  }
}
