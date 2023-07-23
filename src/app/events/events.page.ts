import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DbService } from '../db.service';
import { Day, Event } from '../models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-events',
  templateUrl: 'events.page.html',
  styleUrls: ['events.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, ScrollingModule],
})
export class EventsPage {
  title = 'Events';
  events: Event[] = [];
  days: Day[] = [];
  search: string = '';
  screenHeight: number = window.screen.height;
  day: Date | undefined = undefined;
  constructor(private db: DbService) {}

  async ionViewDidEnter() {    
    this.events = await this.db.getEvents(0, 9999);    
    this.days = await this.db.getDays();
  }

  handleInput(event: any) {
    this.search = event.target.value.toLowerCase();
    this.update();
  }

  eventsTrackBy(index: number, event: Event) {
    return event.uid;
  }

  dayChange(event: any) {    
    this.day = new Date(event.target.value);
    this.title = this.day.toLocaleDateString('en-US', { weekday: 'long' });
    this.update();
  }

  async update() {
    this.events = await this.db.findEvents(this.search, this.day);    
    console.log(`${this.events.length} events`);
  }
  
}