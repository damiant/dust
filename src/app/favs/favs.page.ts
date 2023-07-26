import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Event } from '../models';
import { FavoritesService } from '../favorites.service';
import { EventComponent } from '../event/event.component';
import { DbService } from '../db.service';

@Component({
  selector: 'app-favs',
  templateUrl: './favs.page.html',
  styleUrls: ['./favs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, EventComponent]
})
export class FavsPage implements OnInit {

  events: Event[] = [];
  constructor(private fav: FavoritesService, private db: DbService) { 
    effect(() => {
      console.log('update fav');
      this.fav.changed();
      this.update();
    });
  }

  async ionViewWillEnter() {
     if (this.events.length == 0) {
      this.update();
     }
     console.log('favs enter', this.events);
  }

  private async update() {
    this.events = await this.db.getEventList(await this.fav.getEvents());
  }

  ngOnInit() {

  }

  eventsTrackBy(index: number, event: Event) {
    return event.uid;
  }
}
