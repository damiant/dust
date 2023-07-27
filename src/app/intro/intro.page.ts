import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { DbService } from '../db.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { SettingsService } from '../settings.service';
import { FavoritesService } from '../favorites.service';

export interface Card {
  name: string;
  year: string;
}
@Component({
  selector: 'app-intro',
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class IntroPage implements OnInit {
  ready = true;
  cards: Card[] = [
    { name: 'TTITD', year: '2023' },
    { name: 'TTITD', year: '2022' },
    { name: 'TTITD', year: '2019' },
    { name: 'TTITD', year: '2018' },
    { name: 'TTITD', year: '2017' }];
  selected: Card = this.cards[0];
  constructor(private db: DbService, private settingsService: SettingsService, private fav: FavoritesService,private router: Router) { }

  async ngOnInit() {
    this.save(); // Needed in case user has restarted
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 100);
  }

  async go() {
    try {
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

}
