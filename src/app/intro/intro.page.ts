import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { DbService } from '../db.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { SettingsService } from '../settings.service';
import { FavoritesService } from '../favorites.service';
import { MessageComponent } from '../message/message.component';
import { addDays, daysBetween, delay, isWhiteSpace, now } from '../utils';
import { Dataset } from '../models';
import { datasetFilename } from '../api';
import { ApiService } from '../api.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { ThemePrimaryColor, UiService } from '../ui.service';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, MessageComponent]
})
export class IntroPage implements OnInit {
  ready = true;
  showMessage = false;
  downloading = false;
  yearSelectedAlready = true;
  cards: Dataset[] = [];
  selected: Dataset | undefined;
  message = '';

  constructor(private db: DbService, private api: ApiService,
    private settingsService: SettingsService, private ui: UiService,
    private fav: FavoritesService, private router: Router) { }

  async ngOnInit() {
    // Whether the user has selected a year previously
    this.yearSelectedAlready = !isWhiteSpace(this.settingsService.settings.dataset);

    this.cards = await this.loadDatasets();
    this.ui.setNavigationBar(ThemePrimaryColor);
    await delay(500);
    if (Capacitor.isNativePlatform()) {
      await StatusBar.setStyle({ style: Style.Dark });
      await this.ui.setStatusBarBackgroundColor();
      await SplashScreen.hide();
      await delay(200);
      await this.ui.setStatusBarBackgroundColor();
    }

    console.log(this.settingsService.settings.dataset);
    this.selected = this.cards[0];
    this.save(); // Needed in case user has restarted


    await delay(1000);
    try {
      this.downloading = true;
      await this.api.download();
    } finally {
      this.downloading = false;
    }
    if (this.yearSelectedAlready) {
      this.go();
    }
  }

  ionViewWillEnter() {
    this.showMessage = false;
  }

  async go() {
    if (!this.selected) return;
    const thisYear = this.selected.year == this.cards[0].year;
    const start = new Date(this.cards[0].start);
    const manBurns = addDays(start, 6);
    const x = daysBetween(now(), manBurns);
    const until = daysBetween(now(), start);


    const hideLocations = (thisYear && until > 1);
    this.db.setHideLocations(hideLocations);
    //console.log(start, manBurns, x, until);
    if (hideLocations && !this.yearSelectedAlready) {
      this.message = `Locations for camps and art will be released in the app on Sunday 27th. There are ${x} days until the man burns.`;
      this.showMessage = true;
    } else {
      this.launch();
    }
  }

  async launch() {
    try {
      if (!this.selected) return;
      this.ready = false;
      await this.db.init(this.settingsService.settings.dataset);
      await this.api.sendDataToWorker();
      this.fav.init(this.settingsService.settings.dataset);
      const title = (this.selected.year == this.cards[0].year) ? '' : this.selected.year;
      this.db.selectedYear.set(title);
      if (Capacitor.isNativePlatform()) {
        setTimeout(async () => {
          this.ui.setNavigationBar();
          //this.ui.hideNavigationBar();
          StatusBar.setStyle({ style: this.ui.darkMode() ? Style.Dark : Style.Light });
          this.ui.setStatusBarBackgroundColor(this.ui.darkMode() ? '#000000' : '#FFFFFF');
        }, 100);
      }
      await this.router.navigateByUrl('/tabs/events');
    } finally {
      setTimeout(() => {
        this.ready = true;
      }, 2000);
    }
  }

  open(card: Dataset) {
    this.selected = card;
    this.save();
  }

  save() {
    this.settingsService.settings.dataset = datasetFilename(this.selected!);
    this.settingsService.settings.eventTitle = this.selected!.title;
    this.settingsService.save();
  }

  private async loadDatasets(): Promise<Dataset[]> {
    const res = await fetch('assets/datasets/datasets.json');
    return await res.json();
  }

}
