import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DbService } from '../db.service';
import { Day, Event } from '../models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MapPoint, toMapPoint } from '../map/map.component';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { FormsModule } from '@angular/forms';
import { now, sameDay } from '../utils';
import { App } from '@capacitor/app';
import { FavoritesService } from '../favorites.service';
import { EventComponent, MapAction } from '../event/event.component';

@Component({
  selector: 'app-events',
  templateUrl: 'events.page.html',
  styleUrls: ['events.page.scss'],
  standalone: true,
  imports: [
    IonicModule, CommonModule, RouterModule, ScrollingModule, 
    MapModalComponent, FormsModule, EventComponent],
})
export class EventsPage implements OnInit {
  title = 'Events';
  defaultDay: any = 'all';
  events: Event[] = [];
  days: Day[] = [];
  search: string = '';
  noEvents = false;
  screenHeight: number = window.screen.height;
  day: Date | undefined = undefined;
  showMap = false;
  mapTitle = '';
  mapSubtitle = '';
  mapPoints: MapPoint[] = [];
  minBufferPx = 1900;
  constructor(private db: DbService, private fav: FavoritesService) { }

  ngOnInit() {
    App.addListener('resume', async () => {
      this.setToday(now());
      await this.db.checkEvents();
      this.update();
    });
  }

  async ionViewWillEnter() {
    if (this.events.length == 0) {
      this.days = await this.db.getDays();
      const today = now();
      this.setToday(today);
      await this.db.getEvents(0, 9999);
      await this.db.checkEvents();
      this.defaultDay = this.chooseDefaultDay(today);
      this.update();
    } else {
      // Hack to ensure tab view is updated on switch of tabs
      this.minBufferPx = (this.minBufferPx == 1901) ? 1900 : 1901;
    }
  }

  star(event: Event) {
    event.star = !event.star;
    this.fav.starEvent(event.star, event.uid);
  }

  chooseDefaultDay(today: Date): Date | string {
    for (const day of this.days) {
      if (day.date && sameDay(day.date, today)) {
        this.day = day.date;
        return day.date;
      }
    }
    this.day = undefined;
    return 'all';
  }

  setToday(today: Date) {
    for (const day of this.days) {
      day.today = sameDay(day.date, today);
    }
  }

  handleInput(event: any) {
    this.search = event.target.value.toLowerCase();
    this.update();
  }

  eventsTrackBy(index: number, event: Event) {
    return event.uid;
  }

  dayChange(event: any) {
    if (event.target.value == 'all') {
      this.day = undefined;
      this.title = 'Events';
    } else {
      this.day = new Date(event.target.value);
      this.title = this.day.toLocaleDateString('en-US', { weekday: 'long' });
    }
    this.update();
  }

  map(action: MapAction) {
    this.mapPoints = [toMapPoint(action.location)];
    this.mapTitle = action.title;
    this.mapSubtitle = action.location;
    this.showMap = true;
  }

  async update() {
    this.events = await this.db.findEvents(this.search, this.day);
    console.log(`${this.events.length} events`);
    this.noEvents = this.events.length == 0;
  }

}