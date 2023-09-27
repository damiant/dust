import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { DbService } from '../data/db.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { SettingsService } from '../data/settings.service';
import { FavoritesService } from '../favs/favorites.service';
import { MessageComponent } from '../message/message.component';
import { addDays, daysUntil, delay, isWhiteSpace, now } from '../utils/utils';
import { Dataset } from '../data/models';
import { datasetFilename } from '../data/api';
import { ApiService } from '../data/api.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { ThemePrimaryColor, UiService } from '../ui/ui.service';
import { environment } from 'src/environments/environment';
import { Network } from '@capacitor/network';
import { Directory, Filesystem } from '@capacitor/filesystem';

interface IntroState {
  ready: boolean,
  showMessage: boolean
  downloading: boolean
  eventAlreadySelected: boolean
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
    clearCount: 0
  }
}

@Component({
  selector: 'app-intro',
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, MessageComponent]
})
export class IntroPage {
  vm: IntroState = initialState();

  constructor(private db: DbService, private api: ApiService,
    private settingsService: SettingsService, private ui: UiService,
    private fav: FavoritesService, private router: Router, private toastController: ToastController) { }

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
      await this.api.download(this.vm.selected);
    } finally {
      this.vm.downloading = false;
    }
    console.log(`Auto starting = ${this.vm.eventAlreadySelected}...`);
    if (this.vm.eventAlreadySelected) {
      this.go();
    }
  }

  private load() {
    const idx = this.vm.cards.findIndex((c) => datasetFilename(c) == this.settingsService.settings.datasetId);
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

    let hideLocations = (until > 1 && this.isBurningMan());
    if (environment.overrideLocations) {
      hideLocations = false;
      console.error('Overriding hiding locations');
    }
    console.log(`Event starts ${start}, today is ${now()} and there are ${until} days until then`);
    this.db.setHideLocations(hideLocations);
    if (hideLocations && !this.vm.eventAlreadySelected) {
      this.vm.message = `Locations for camps and art will be released in the app on Sunday 27th. There are ${x} days until the man burns.`;
      this.vm.showMessage = true;
    } else {
      this.vm.showMessage = false;
      this.launch();
    }
  }

  isCurrentYear() {
    return this.vm.selected && this.vm.selected.year == this.vm.cards[0].year;
  }

  isBurningMan() {
    return this.settingsService.settings.datasetId.includes('ttitd');
  }

  async launch() {
    try {
      if (!this.vm.selected) return;

      if (!this.isCurrentYear()) {
        const status = await Network.getStatus();
        if (!status.connected) {
          this.ui.presentDarkToast('You are offline: Previous years require network access. Try this year instead.', this.toastController);
          this.vm.eventAlreadySelected = false;
          this.vm.selected = this.vm.cards[0];
          this.save();
          return;
        }

      }
      this.vm.ready = false;
      this.vm.showMessage = false;


      const revision = await this.db.init(this.settingsService.settings.datasetId);
      const useData = await this.api.sendDataToWorker(revision, this.db.locationsHidden(), this.isBurningMan());

      this.fav.init(this.settingsService.settings.datasetId);
      const title = (this.isCurrentYear()) ? '' : this.vm.selected.year;
      this.db.selectedYear.set(title);

      const hidden = [];
      if (this.isBurningMan() && !this.isCurrentYear()) {
        hidden.push('rsl');
      }
      if (!this.isBurningMan()) {
        hidden.push('rsl');
        hidden.push('art');
        hidden.push('friends');
        hidden.push('private');
      }
      this.db.featuresHidden.set(hidden);
      if (Capacitor.isNativePlatform()) {
        setTimeout(async () => {
          this.ui.setNavigationBar();
          StatusBar.setStyle({ style: this.ui.darkMode() ? Style.Dark : Style.Light });
          this.ui.setStatusBarBackgroundColor(this.ui.darkMode() ? '#000000' : '#FFFFFF');
        }, 100);
      }
      await this.router.navigateByUrl('/tabs/events');
    } finally {
      setTimeout(() => {
        this.vm.ready = true;
      }, 2000);
    }
  }

  open(card: Dataset) {
    this.vm.selected = card;
    this.save();
  }

  save() {
    this.settingsService.settings.datasetId = datasetFilename(this.vm.selected!);
    this.settingsService.settings.dataset = this.vm.selected;
    this.settingsService.settings.mapRotation = this.isBurningMan() ? 45 : 0; // Burning Mans map is rotate 45 degrees
    this.settingsService.settings.eventTitle = this.vm.selected!.title;
    this.settingsService.save();
  }

}
