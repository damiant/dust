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
import { SkeletonEventComponent } from '../skeleton-event/skeleton-event.component';
import { SearchComponent } from '../search/search.component';

@Component({
  selector: 'app-events',
  templateUrl: 'events.page.html',
  styleUrls: ['events.page.scss'],
  standalone: true,
  imports: [
    IonicModule, CommonModule, RouterModule, ScrollingModule,
    MapModalComponent, FormsModule, EventComponent, CategoryComponent,
    SkeletonEventComponent, SearchComponent],
})
export class EventsPage implements OnInit {
  title = 'Events';
  defaultDay: any = 'all';
  category = '';
  events: Event[] = [];
  days: Day[] = [];
  categories: string[] = ['All Events'];
  search: string = '';
  noEvents = false;
  noEventsMessage = '';
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

  async ionViewWillEnter() {
    if (this.events.length == 0) {
      const today = now();
      this.setToday(today);
      await this.db.checkEvents();
      this.days = await this.db.getDays();
      this.db.getCategories().then((categories) => this.categories = categories);
      this.defaultDay = this.chooseDefaultDay(now());
      await this.update();
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
        this.db.selectedDay.set(this.day);
        return day.date;
      }
    }
    this.day = undefined;
    this.db.selectedDay.set(noDate());
    return 'all';
  }

  setToday(today: Date) {
    for (const day of this.days) {
      day.today = sameDay(day.date, today);
    }
  }

  searchEvents(value: string) {
    this.search = value.toLowerCase();
    this.update(true);
  }

  eventsTrackBy(index: number, event: Event) {
    return event.uid;
  }

  async dayChange(event: any) {
    if (event.target.value == 'all') {
      this.db.selectedDay.set(noDate());
      this.day = undefined;
    } else {
      this.db.selectedDay.set(new Date(event.target.value));
      this.day = this.db.selectedDay();
    }
    console.log(`Day Change ${this.day}`);

    this.updateTitle();
    await this.update(true);
  }

  private updateTitle() {
    const day = this.db.selectedDay();

    this.title = (day !== noDate()) ? day.toLocaleDateString('en-US', { weekday: 'long' }) : 'Events';
  }

  map(event: Event) {
    this.mapPoints = [toMapPoint(event.location)];
    this.mapTitle = event.camp;
    this.mapSubtitle = event.location;
    this.showMap = true;
  }

  async update(scrollToTop?: boolean) {
    console.time('update');
    this.events = await this.db.findEvents(this.search, this.day, this.category);
    console.timeEnd('update');
    this.noEvents = this.events.length == 0;
    this.noEventsMessage = this.search?.length > 0 ?
      `There are no events matching "${this.search}"` :
      'All the events for this day have concluded.';
    if (scrollToTop) {
      this.hack();
      this.virtualScroll.scrollToOffset(0, 'smooth');
    }
  }

}