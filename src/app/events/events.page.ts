import { Component, ViewChild, effect } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { DbService } from '../data/db.service';
import { Day, Event, MapPoint } from '../data/models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { FormsModule } from '@angular/forms';
import { noDate, now, nowRange, sameDay, timeRangeToString } from '../utils/utils';
import { EventComponent } from '../event/event.component';
import { UiService } from '../ui/ui.service';
import { CategoryComponent } from '../category/category.component';
import { SkeletonEventComponent } from '../skeleton-event/skeleton-event.component';
import { SearchComponent } from '../search/search.component';
import { toMapPoint } from '../map/map.utils';
import { GpsCoord } from '../map/geo.utils';
import { GeoService } from '../geolocation/geo.service';
import { SettingsService } from '../data/settings.service';
import { addIcons } from 'ionicons';
import { compass, compassOutline } from 'ionicons/icons';

interface EventsState {
  title: string;
  defaultDay: any;
  category: string;
  events: Event[];
  days: Day[];
  categories: string[];
  search: string;
  noEvents: boolean;
  showImage: boolean;
  noEventsMessage: string;
  screenHeight: number;
  day: Date | undefined;
  showMap: boolean;
  mapTitle: string;
  mapSubtitle: string;
  mapPoints: MapPoint[];
  minBufferPx: number;
  byDist: boolean;
  isNow: boolean;
  timeRange: string;
  displayedDistMessage: boolean;
}

function initialState(): EventsState {
  return {
    title: 'Events',
    defaultDay: 'all',
    category: '',
    events: [],
    days: [],
    categories: ['All Events'],
    search: '',
    noEvents: false,
    showImage: true,
    noEventsMessage: '',
    screenHeight: window.screen.height,
    day: undefined,
    showMap: false,
    mapTitle: '',
    mapSubtitle: '',
    mapPoints: [],
    byDist: false,
    isNow: false,
    timeRange: '',
    displayedDistMessage: false,
    minBufferPx: 1900,
  };
}

@Component({
  selector: 'app-events',
  templateUrl: 'events.page.html',
  styleUrls: ['events.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ScrollingModule,
    MapModalComponent,
    FormsModule,
    EventComponent,
    CategoryComponent,
    IonSegment,
    IonSegmentButton,
    IonToolbar,
    IonText,
    IonButtons,
    IonTitle,
    IonHeader,
    IonContent,
    SkeletonEventComponent,
    SearchComponent,
    IonButton,
    IonBadge,
    IonIcon,
  ],
})
export class EventsPage {
  vm: EventsState = initialState();

  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport;

  constructor(
    public db: DbService,
    private ui: UiService,
    private settings: SettingsService,
    private toastController: ToastController,
    private geo: GeoService,
  ) {
    addIcons({ compass, compassOutline });
    effect(() => {
      this.ui.scrollUp('events', this.virtualScroll);
    });
    effect(() => {
      const _year = this.db.selectedYear();
      this.db.checkInit();
      this.vm = initialState();
      this.init();
    });
    effect(async () => {
      const _r = this.db.resume();
      this.setToday(now());
      await this.db.checkEvents();
      this.update();
    });
    effect(() => {
      const status = this.db.networkStatus();
      this.vm.showImage = status == 'wifi' || status == 'cellular';
    });
  }

  ionViewDidEnter() {
    this.hack();
  }

  private async init() {
    const today = now();
    this.setToday(today);
    await this.db.checkEvents();
    this.vm.days = await this.db.getDays();
    this.db.getCategories().then((categories) => (this.vm.categories = categories));
    this.vm.defaultDay = this.chooseDefaultDay(now());
    await this.update();
  }

  public categoryChanged() {
    this.update(true);
  }

  toggleByDist() {
    this.vm.byDist = !this.vm.byDist;
    if (this.vm.byDist && !this.vm.displayedDistMessage) {
      this.ui.presentToast(`Displaying events sorted by distance`, this.toastController);
      this.vm.displayedDistMessage = true;
    }
    this.update(true);
  }

  private hack() {
    // Hack to ensure tab view is updated on switch of tabs or when day is changed
    this.vm.minBufferPx = this.vm.minBufferPx == 1901 ? 1900 : 1901;
  }

  private chooseDefaultDay(today: Date): Date | string {
    for (const day of this.vm.days) {
      if (day.date && sameDay(day.date, today)) {
        this.vm.day = day.date;
        this.db.selectedDay.set(this.vm.day);
        return day.date;
      }
    }
    this.vm.day = undefined;
    this.db.selectedDay.set(noDate());
    return 'all';
  }

  setToday(today: Date) {
    for (const day of this.vm.days) {
      day.today = sameDay(day.date, today);
    }
  }

  searchEvents(value: string) {
    this.vm.search = value.toLowerCase();
    this.update(true);
  }

  eventsTrackBy(index: number, event: Event) {
    return event.uid;
  }

  async dayChange(event: any) {
    this.vm.isNow = false;
    if (event.target.value == 'all') {
      this.db.selectedDay.set(noDate());
      this.vm.day = undefined;
    } else if (event.target.value == 'now') {
      this.db.selectedDay.set(noDate());
      this.vm.day = undefined;
      this.vm.isNow = true;
    } else {
      this.db.selectedDay.set(new Date(event.target.value));
      this.vm.day = this.db.selectedDay();
    }
    console.log(`Day Change ${this.vm.day}`);

    this.updateTitle();
    await this.update(true);
  }

  private updateTitle() {
    const day = this.db.selectedDay();
    if (this.vm.isNow) {
      this.vm.title = 'Now';
      return;
    }
    this.vm.title = !sameDay(day, noDate()) ? day.toLocaleDateString('en-US', { weekday: 'long' }) : 'Events';
  }

  map(event: Event) {
    this.vm.mapPoints = [toMapPoint(event.location, undefined, event.pin)];
    this.vm.mapTitle = event.camp;
    this.vm.mapSubtitle = event.location;
    this.vm.showMap = true;
  }

  async update(scrollToTop?: boolean) {
    let coords: GpsCoord | undefined = undefined;
    if (this.vm.byDist) {
      coords = await this.geo.getPosition();
    }

    const timeRange = this.vm.isNow ? nowRange() : undefined;
    this.vm.timeRange = timeRangeToString(timeRange);    
    this.vm.events = await this.db.findEvents(
      this.vm.search, // Search terms
      this.vm.day, // Selected day
      this.vm.category, // Filtered category
      coords, // Geolocation
      timeRange, // Time Range
      this.settings.settings.longEvents, // Filter events > 6 hrs
    );
    this.vm.noEvents = this.vm.events.length == 0;
    this.vm.noEventsMessage = this.noEventsMessage();
    if (scrollToTop) {
      this.hack();
      this.virtualScroll.scrollToOffset(0, 'smooth');
    }
  }

  private noEventsMessage(): string {
    if (this.vm.search?.length > 0) {
      return `There are no events matching "${this.vm.search}".`;
    } else if (this.vm.isNow) {
      return `There are no events starting ${this.vm.timeRange}`;
    }
    return this.db.eventHasntBegun() ?
    'Events have not been added yet.' : 
    'All the events for this day have concluded.';    
  }
}
