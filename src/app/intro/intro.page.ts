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
import { addDays, daysBetween, now } from '../utils';

export interface Card {
  name: string;
  year: string;
  start: string;
}
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
  cards: Card[] = [];
  selected: Card | undefined;
  message = '';

  constructor(private db: DbService, private settingsService: SettingsService, private fav: FavoritesService, private router: Router) { }

  async ngOnInit() {
    this.cards = await this.loadDatasets();
    this.selected = this.cards[0];
    this.save(); // Needed in case user has restarted
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 100);
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
    console.log(start, manBurns, x, until);
    if (thisYear && until > 1) {
      this.message = `Information for this year will become available on Sunday 27th. There are ${x} days until the man burns.`;
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
      this.fav.init(this.settingsService.settings.dataset);
      const title = (this.selected.year == this.cards[0].year) ? '' : this.selected.year;
      this.db.selectedYear.set(title);
      this.router.navigateByUrl('/tabs/events');
    } finally {
      this.ready = true;
    }
  }

  open(card: Card) {
    this.selected = card;
    this.save();
  }

  save() {
    this.settingsService.settings.dataset = `${this.selected?.name.toLowerCase()}-${this.selected?.year.toLowerCase()}`;
    this.settingsService.save();
  }

  private async loadDatasets(): Promise<Card[]> {
    const res = await fetch('assets/datasets.json');
    return await res.json();
  }

}
