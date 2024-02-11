import { Component, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  InfiniteScrollCustomEvent,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPopover,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { UiService } from '../ui/ui.service';
import { DbService } from '../data/db.service';
import { noDate, now, sameDay } from '../utils/utils';
import { Day, MapPoint, Names, RSLEvent } from '../data/models';
import { GpsCoord } from '../map/geo.utils';
import { GeoService } from '../geolocation/geo.service';
import { SearchComponent } from '../search/search.component';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { SkeletonEventComponent } from '../skeleton-event/skeleton-event.component';
import { ArtCarEvent, RslEventComponent } from '../rsl-event/rsl-event.component';
import { toMapPoint } from '../map/map.utils';
import { FavoritesService } from '../favs/favorites.service';
import { addIcons } from 'ionicons';
import { compass, compassOutline } from 'ionicons/icons';

interface RSLState {
  byDist: boolean;
  days: Day[];
  events: RSLEvent[];
  search: string;
  mapTitle: string;
  mapSubtitle: string;
  title: string;
  defaultDay: any;
  showMap: boolean;
  noEvents: boolean;
  noEventsMessage: string;
  mapPoints: MapPoint[];
  day: Date;
  isOpen: boolean;
  message: string;
  displayedDistMessage: boolean;
}

function initialState(): RSLState {
  return {
    byDist: false,
    days: [],
    events: [],
    search: '',
    title: 'Rock Star Librarian',
    mapTitle: '',
    mapSubtitle: '',
    mapPoints: [],
    showMap: false,
    noEvents: false,
    noEventsMessage: '',
    day: noDate(),
    isOpen: false,
    message: '',
    defaultDay: 'all',
    displayedDistMessage: false,
  };
}
@Component({
  selector: 'app-rsl',
  templateUrl: './rsl.page.html',
  styleUrls: ['./rsl.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RslEventComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonSegment,
    IonButton,
    IonContent,
    IonTitle,
    IonSegmentButton,
    IonPopover,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonText,
    SearchComponent,
    MapModalComponent,
    SkeletonEventComponent,
  ],
})
export class RslPage {
  vm: RSLState = initialState();
  allEvents: RSLEvent[] = [];
  @ViewChild(IonContent) ionContent!: IonContent;
  @ViewChild('popover') popover: any;
  constructor(
    private ui: UiService,
    private db: DbService,
    private geo: GeoService,
    private fav: FavoritesService,
    private toastController: ToastController,
  ) {
    addIcons({ compass, compassOutline });
    effect(() => {
      this.ui.scrollUpContent('rsl', this.ionContent);
    });
    effect(() => {
      const _year = this.db.selectedYear();
      this.db.checkInit();
      this.vm = initialState();
      this.init();
    });
    effect(async () => {
      const resumed = this.db.resume();
      if (resumed.length > 0) {
        await this.update();
      }
    });
  }

  private async init() {
    const today = now();
    this.setToday(today);

    this.vm.days = await this.db.getDays(Names.rsl);
    console.log('init RSL days', this.vm.days);
    this.vm.defaultDay = this.chooseDefaultDay(now());
    this.updateTitle();
    await this.update();
  }

  onIonInfinite(ev: any) {
    this.addEvents(50);
    setTimeout(() => {
      (ev as InfiniteScrollCustomEvent).target.complete();
    }, 10);
  }

  private async update(scrollToTop?: boolean) {
    let coords: GpsCoord | undefined = undefined;
    if (this.vm.byDist) {
      coords = await this.geo.getPosition();
    }
    const favs = await this.fav.getFavorites();
    const events = await this.db.getRSL(this.vm.search, this.vm.day, coords);
    this.fav.setFavorites(events, favs.rslEvents);
    this.allEvents = events;
    this.vm.events = [];
    this.addEvents(50);
    await this.handleNoEvents();
    if (scrollToTop) {
      this.ui.scrollUpContent('rsl', this.ionContent);
    }
  }

  private async handleNoEvents() {
    if (this.vm.events.length > 0) {
      this.vm.noEvents = false;
      this.vm.noEventsMessage = '';
      return;
    }
    const wasSearch = this.vm.search?.length > 0;
    const days = await this.db.searchRSL(this.vm.search);
    if (days.length == 0) {
      this.vm.noEvents = this.vm.events.length == 0;
      this.vm.noEventsMessage = wasSearch
        ? `There are no events matching "${this.vm.search}".`
        : this.noEventsMessage();
    } else {
      const otherDays = days.map((d) => `${d.name}`).join(', ');
      this.vm.noEvents = true;
      this.vm.noEventsMessage = wasSearch
        ? `There are no events matching "${this.vm.search}" for this day but there are on ${otherDays}.`
        : 'There are no events on this day.';
    }
  }

  private noEventsMessage() {
    return this.db.eventHasntBegun() ?
      'Events have not been added yet.' :
      'All the events for this day have concluded.';
  }

  private addEvents(count: number) {
    const items = this.allEvents.slice(this.vm.events.length, this.vm.events.length + count);
    let hidingImage: string | undefined;
    for (let item of items) {
      if (hidingImage == item.imageUrl) {
        item.imageUrl = undefined; // This ensures that 2 events with the same image do not appear
      }
      if (item.imageUrl) {
        hidingImage = item.imageUrl;
      }
      this.vm.events.push(item);
    }
  }

  public artCar(e: ArtCarEvent) {
    this.presentPopover(e.event, `This event is located at the ${e.artCar} art car.`);
  }

  public rslLogo() {
    this.ui.openUrl('https://www.rockstarlibrarian.com/');
  }

  async presentPopover(e: Event, message: string) {
    this.popover.event = e;
    this.vm.message = message;
    this.vm.isOpen = true;
  }

  public map(event: RSLEvent) {
    this.vm.mapPoints = [toMapPoint(event.location)];
    this.vm.mapTitle = event.camp;
    this.vm.mapSubtitle = event.location;
    this.vm.showMap = true;
  }

  public async dayChange(event: any) {
    this.vm.day = new Date(event.target.value);
    console.log(`Day Change ${this.vm.day}`);

    this.updateTitle();
    await this.update(true);
  }

  private updateTitle() {
    const day = this.vm.day;
    this.vm.title = !sameDay(day, noDate()) ? day.toLocaleDateString('en-US', { weekday: 'long' }) : 'Music';
  }

  private setToday(today: Date) {
    for (const day of this.vm.days) {
      day.today = sameDay(day.date, today);
    }
  }

  public eventsTrackBy(index: number, event: RSLEvent) {
    return event.id;
  }

  public searchEvents(value: string) {
    this.vm.search = value.toLowerCase();
    this.update(true);
  }

  private chooseDefaultDay(today: Date): Date | string {
    for (const day of this.vm.days) {
      if (day.date && sameDay(day.date, today)) {
        this.vm.day = day.date;
        return day.date;
      }
    }
    this.vm.day = this.vm.days[0].date;
    return this.vm.days[0].date;
  }

  toggleByDist() {
    this.vm.byDist = !this.vm.byDist;
    if (this.vm.byDist && !this.vm.displayedDistMessage) {
      this.ui.presentToast(`Displaying events sorted by distance`, this.toastController);
      this.vm.displayedDistMessage = true;
    }
    this.update(true);
  }
}
