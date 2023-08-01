import { Component, OnInit, ViewChild, effect } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DbService } from '../db.service';
import { Day, Event } from '../models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { MapPoint, toMapPoint } from '../map/map.component';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { FormsModule } from '@angular/forms';
import { noDate, now, sameDay } from '../utils';
import { App } from '@capacitor/app';
import { EventComponent } from '../event/event.component';
import { UiService } from '../ui.service';
import { CategoryComponent } from '../category/category.component';

@Component({
  selector: 'app-events',
  templateUrl: 'events.page.html',
  styleUrls: ['events.page.scss'],
  standalone: true,
  imports: [
    IonicModule, CommonModule, RouterModule, ScrollingModule,
    MapModalComponent, FormsModule, EventComponent, CategoryComponent],
})
export class EventsPage implements OnInit {
  title = 'Events';
  defaultDay: any = 'all';
  category = '';
  events: Event[] = [];
  days: Day[] = [];
  categories: string[] = [];
  search: string = '';
  noEvents = false;
  screenHeight: number = window.screen.height;
  day: Date | undefined = undefined;
  showMap = false;
  mapTitle = '';
  mapSubtitle = '';
  mapPoints: MapPoint[] = [];
  minBufferPx = 1900;
  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport;

  constructor(public db: DbService, private ui: UiService) {
    effect(() => {
      this.ui.scrollUp('events', this.virtualScroll);
    });
  }

  ngOnInit() {
    App.addListener('resume', async () => {
      this.setToday(now());
      await this.db.checkEvents();
      this.update();
    });
  }

  home() {
    this.ui.home();
  }

  async ionViewWillEnter() {
    if (this.events.length == 0) {
      this.days = await this.db.getDays();
      this.categories = await this.db.getCategories();
      const today = now();
      this.setToday(today);
      await this.db.getEvents(0, 9999);
      await this.db.checkEvents();
      this.defaultDay = this.chooseDefaultDay(today);
      this.update();
    } else {
      this.hack();
    }
  }

  public categoryChanged() {
    this.update(true);
  }


  private hack() {
    // Hack to ensure tab view is updated on switch of tabs or when day is changed
    this.minBufferPx = (this.minBufferPx == 1901) ? 1900 : 1901;
  }

  private chooseDefaultDay(today: Date): Date | string {
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
    this.update(true);
  }

  eventsTrackBy(index: number, event: Event) {
    return event.uid;
  }

  async dayChange(event: any) {
    if (event.target.value == 'all') {
      this.day = undefined;
      this.db.selectedDay.set(noDate());
    } else {
      this.day = new Date(event.target.value);
      this.db.selectedDay.set(this.day);
    }
    this.updateTitle();
    await this.update(true);
  }

  private updateTitle() {
    this.title = (this.day) ? this.day.toLocaleDateString('en-US', { weekday: 'long' }) : 'Events';
  }

  map(event: Event) {
    this.mapPoints = [toMapPoint(event.location)];
    this.mapTitle = event.camp;
    this.mapSubtitle = event.location;
    this.showMap = true;
  }

  async update(scrollToTop?: boolean) {
    this.events = await this.db.findEvents(this.search, this.day, this.category);
    console.log(`${this.events.length} events`);
    this.noEvents = this.events.length == 0;
    if (scrollToTop) {      
      this.hack();
      this.virtualScroll.scrollToOffset(0, 'smooth');
    }
  }

}