import { Component } from '@angular/core';
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

@Component({
  selector: 'app-events',
  templateUrl: 'events.page.html',
  styleUrls: ['events.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, ScrollingModule, MapModalComponent, FormsModule],
})
export class EventsPage {
  title = 'Events';
  defaultDay: any = 'all';
  events: Event[] = [];
  days: Day[] = [];
  search: string = '';
  screenHeight: number = window.screen.height;
  day: Date | undefined = undefined;
  showMap = false;
  mapTitle = '';
  mapSubtitle = '';
  mapPoints: MapPoint[] = [];
  constructor(private db: DbService) { }

  async ionViewDidEnter() {
    if (this.events.length == 0) {

      this.days = await this.db.getDays();
      this.setToday();
      await this.db.getEvents(0, 9999);
      await this.db.checkEvents();
      this.defaultDay = this.chooseDefaultDay();
      this.update();
    }
  }

  chooseDefaultDay(): Date | string {
    const today = now();
    for (const day of this.days) { 
      if (day.date && sameDay(day.date, today)) {
        this.day = day.date;
        return day.date;
      }
    }
    this.day = undefined;
    return 'all';
  }

  setToday() {
    for (const day of this.days) {
      day.today = sameDay(day.date, now());
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

  map(location: string, title: string) {
    this.mapPoints = [toMapPoint(location)];
    this.mapTitle = title;
    this.mapSubtitle = location;
    this.showMap = true;
  }

  async update() {
    this.events = await this.db.findEvents(this.search, this.day);
    console.log(`${this.events.length} events`);
  }

}