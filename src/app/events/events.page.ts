import { Component, effect, viewChild, inject, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  ToastController
} from '@ionic/angular/standalone';
import { DbService } from '../data/db.service';
import { Day, Event, MapPoint, Names } from '../data/models';
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
import { FavoritesService } from '../favs/favorites.service';
import { EventPositionChange, EventsService } from './events.service';
import { Subscription } from 'rxjs';
import { SortComponent } from '../sort/sort.component';

interface EventsState {
  title: string;
  defaultDay: any;
  category: string;
  events: Event[];
  days: Day[];
  categories: string[];
  search: string;
  noEvents: boolean;
  cardHeight: number;
  pastEventOption: boolean;
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
    cardHeight: 180,
    noEvents: false,
    pastEventOption: false,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    SortComponent,
    IonButton,
    IonBadge,
    IonIcon,
  ],
})
export class EventsPage implements OnInit, OnDestroy {
  public db = inject(DbService);
  private ui = inject(UiService);
  private fav = inject(FavoritesService);
  private settings = inject(SettingsService);
  private toastController = inject(ToastController);
  private eventsService = inject(EventsService);
  private nextSubscription?: Subscription;
  private prevSubscription?: Subscription;
  private geo = inject(GeoService);
  private _change = inject(ChangeDetectorRef);
  vm: EventsState = initialState();

  virtualScroll = viewChild.required(CdkVirtualScrollViewport);

  constructor() {
    addIcons({ compass, compassOutline });
    effect(() => {
      this.ui.scrollUp('events', this.virtualScroll());
    });
    effect(
      () => {
        const _year = this.db.selectedYear();
        this.db.checkInit();
        this.vm = initialState();
        this.init();
      },
      { allowSignalWrites: true },
    );

    effect(async () => {
      const _r = this.db.resume();
      this.setToday(now());
      await this.db.checkEvents();
      this.update();
    });
  }

  ngOnInit(): void {
    this.nextSubscription = this.eventsService.next.subscribe((eventId: string) => {
      const idx = this.vm.events.findIndex(e => e.uid == eventId);
      if (idx == -1 || idx + 1 >= this.vm.events.length) return;
      const e = this.vm.events[idx + 1];
      this.eventsService.position.set(idx === this.vm.events.length - 2 ? 'end' : 'middle');
      this.eventsService.eventChanged.emit({ eventId: e.uid });
    });
    this.prevSubscription = this.eventsService.prev.subscribe((eventId) => {
      const idx = this.vm.events.findIndex(e => e.uid == eventId);
      if (idx <= 0) return;
      const e = this.vm.events[idx - 1];
      this.eventsService.position.set(idx === 1 ? 'start' : 'middle');
      this.eventsService.eventChanged.emit({ eventId: e.uid });
    });
  }

  opened(eventId: string) {
    const idx = this.vm.events.findIndex(e => e.uid == eventId);
    let position: EventPositionChange = 'middle';
    if (idx === 0) {
      position = 'start';
    } else if (idx === this.vm.events.length - 1) {
      position = 'end';
    }
    this.eventsService.position.set(position);
  }

  ngOnDestroy(): void {
    if (this.prevSubscription) {
      this.prevSubscription.unsubscribe();
    }
    if (this.nextSubscription) {
      this.nextSubscription.unsubscribe();
    }
  }

  async ionViewDidEnter() {
    this.hack();
    this.vm.cardHeight = 130 + this.ui.textZoom() * 50;
  }

  private async init() {
    const today = now();
    this.setToday(today);
    await this.db.checkEvents();
    this.vm.days = await this.db.getDays(Names.events);
    this.db.getCategories().then((categories) => (this.vm.categories = categories));
    this.vm.defaultDay = this.chooseDefaultDay(now());
    await this.update();
  }

  public categoryChanged() {
    this.updateTitle();
    this.update(true);
  }

  public sortTypeChanged(e: string) {
    this.vm.byDist = e == 'dist';
    if (this.vm.byDist && !this.vm.displayedDistMessage) {
      this.ui.presentToast(`Displaying events sorted by distance`, this.toastController);
      this.vm.displayedDistMessage = true;
    }
    this.update(true);
  }

  public async star(event: Event, star: boolean) {
    const occurrence = this.fav.selectOccurrence(event, this.db.selectedDay());
    const message = await this.fav.starEvent(star, event, this.db.selectedDay(), occurrence);
    if (message) {
      this.ui.presentToast(message, this.toastController);
    }
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  public longEvent(length: number) {
    if (this.settings.shouldLastLongEventsAlert()) {
      this.ui.presentToast(`Long events are displayed at the bottom of the list.`, this.toastController);
      this.settings.setLastLongEventsAlert();
    }
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
    this._change.markForCheck();
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

  home() {
    this.ui.home();
  }

  searchEvents(value: string) {
    this.vm.search = value && (typeof value === 'string') ? value.toLowerCase() : '';
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
    if (this.vm.category != '') {
      this.vm.title = ` ${this.vm.category}`;
    }
  }

  map(event: Event) {
    this.vm.mapPoints = [toMapPoint(event.location, undefined, event.pin)];
    this.vm.mapTitle = event.camp;
    this.vm.mapSubtitle = event.location;
    this.vm.showMap = true;
  }

  showPastEvents() {
    this.db.showPastEvents = true;
    this.update(true);
  }

  async update(scrollToTop?: boolean) {
    let coords: GpsCoord | undefined = undefined;
    if (this.vm.byDist) {
      coords = await this.geo.getPosition();
    }

    const timeRange = this.vm.isNow ? nowRange(this.db.getTimeZone()) : undefined;
    this.vm.timeRange = timeRangeToString(timeRange, this.db.getTimeZone());
    this.vm.events = await this.db.findEvents(
      this.vm.search, // Search terms
      this.vm.day, // Selected day
      this.vm.category, // Filtered category
      coords, // Geolocation
      timeRange, // Time Range
      this.settings.settings.longEvents, // Filter events > 6 hrs
      this.db.showPastEvents
    );
    this.vm.noEvents = this.vm.events.length == 0;
    this.vm.noEventsMessage = this.noEventsMessage();
    this.vm.pastEventOption = !this.vm.isNow && (this.vm.search?.length <= 0) && !this.db.eventHasntBegun() && !this.db.showPastEvents;
    if (scrollToTop) {
      this.hack();
      this.virtualScroll().scrollToOffset(0, 'smooth');
    }
    this._change.markForCheck();
  }

  private noEventsMessage(): string {
    if (this.vm.search?.length > 0) {
      return `There are no events matching "${this.vm.search}".`;
    } else if (this.vm.isNow) {
      return `There are no events from ${this.vm.timeRange.replace('-', ' to ')}`;
    }

    return this.db.eventHasntBegun()
      ? 'Events have not been added yet.'
      : 'All the events for this day have concluded.';
  }
}
