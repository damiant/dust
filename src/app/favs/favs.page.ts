import { Component, OnInit, effect, viewChild, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonActionSheet,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonText,
  IonTitle,
  IonToolbar,
  IonItem,
  IonItemSliding, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { Art, Camp, Event, MapPoint } from '../data/models';
import { FavoritesService } from './favorites.service';
import { EventComponent } from '../event/event.component';
import { DbService } from '../data/db.service';
import { CampComponent } from '../camp/camp.component';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { ArtComponent } from '../art/art.component';
import { UiService } from '../ui/ui.service';
import { CategoryComponent } from '../category/category.component';
import { SearchComponent } from '../search/search.component';
import { distance, formatDistanceMiles, toMapPoint } from '../map/map.utils';
import { GeoService } from '../geolocation/geo.service';
import { addIcons } from 'ionicons';
import { star, starOutline, mapOutline, printOutline, calendarOutline } from 'ionicons/icons';
import { CalendarService } from '../calendar.service';
import { ToastController } from '@ionic/angular';
import { MessageComponent } from '../message/message.component';


enum Filter {
  All = '',
  Camps = 'Camps',
  Art = 'Art',
  Events = 'Events',
}

interface FavsState {
  filter: string;
  events: Event[];
  camps: Camp[];
  art: Art[];
  filters: Filter[];
  showMap: boolean;
  noFavorites: boolean;
  mapTitle: string;
  search: string;
  showCalendarMessage: boolean;
  mapSubtitle: string;
  rslId: string | undefined;
  isActionSheetOpen: boolean;
  mapPoints: MapPoint[];
}

function initialState(): FavsState {
  return {
    filter: '',
    events: [],
    camps: [],
    art: [],
    filters: [Filter.Events, Filter.Camps, Filter.Art],
    showMap: false,
    noFavorites: false,
    showCalendarMessage: false,
    mapTitle: '',
    search: '',
    mapSubtitle: '',
    rslId: undefined,
    isActionSheetOpen: false,
    mapPoints: [],
  };
}

@Component({
  selector: 'app-favs',
  templateUrl: './favs.page.html',
  styleUrls: ['./favs.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonItem,
    CommonModule,
    FormsModule,
    RouterModule,
    EventComponent,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonActionSheet,
    IonText,
    IonBadge,
    CampComponent,
    MapModalComponent,
    ArtComponent,
    CategoryComponent,
    SearchComponent,
    MessageComponent
  ]
})
export class FavsPage implements OnInit {
  private fav = inject(FavoritesService);
  private ui = inject(UiService);
  private geo = inject(GeoService);
  private calendar = inject(CalendarService);
  public db = inject(DbService);
  private toastController = inject(ToastController);
  private _change = inject(ChangeDetectorRef);
  private calendarUrl: string | undefined;
  private router = inject(Router);
  vm: FavsState = initialState();

  ionContent = viewChild.required(IonContent);

  constructor() {
    addIcons({ printOutline, calendarOutline, mapOutline, star, starOutline });
    effect(async () => {
      this.fav.changed();
      await this.update();
    });
    effect(async () => {
      this.db.resume();
      await this.update();
    });

    effect(() => {
      this.ui.scrollUpContent('favs', this.ionContent());
    });
  }

  public actionSheetButtons = [
    {
      text: 'Remove From Favorites',
      role: 'destructive',
      data: {
        action: 'delete',
      },
    },
    {
      text: 'Cancel',
      role: 'cancel',
      data: {
        action: 'cancel',
      },
    },
  ];

  async ionViewWillEnter() {
    this.fav.newFavs.set(0);
    await this.update();
  }

  home() {
    this.ui.home();
  }

  artClick(art: Art) {
    this.router.navigate(['/art/' + art.uid + '+Art']);
  }

  searchFavs(value: string) {
    this.vm.search = value;
    console.log('searchFavs.update');
    this.update();
  }

  async sheetAction(ev: any) {
    this.vm.isActionSheetOpen = false;
    if (ev.detail.role == 'cancel') return;
    if (ev.detail.role == 'destructive') {
      await this.fav.unstarRSLId(this.vm.rslId!);
      await this.update();
    }
  }

  private async update() {
    const favs = await this.fav.getFavorites();
    const items = await this.fav.getRSLEventList(favs.rslEvents);
    const rslEvents = this.filterItems(Filter.Events, items);
    const events = this.filterItems(
      Filter.Events,
      await this.fav.getEventList(favs.events, this.db.isHistorical(), rslEvents, false),
    );
    const camps = this.filterItems(Filter.Camps, await this.db.getCampList(favs.camps));
    const art = this.filterItems(Filter.Art, await this.db.getArtList(favs.art));
    this.vm.events = events;
    this.vm.camps = camps;
    this.vm.art = art;
    this.vm.noFavorites = this.vm.art.length == 0 && this.vm.camps.length == 0 && this.vm.events.length == 0;
    this._change.detectChanges();
  }

  private filterItems(filter: Filter, items: any[]): any[] {
    if (this.vm.filter === filter || this.vm.filter === Filter.All) {
      if (this.vm.search) {
        return this.searchTerms(items);
      }
      return items;
    }
    return [];
  }

  private searchTerms(items: any[]): any[] {
    return items.filter((a) => this.filterTerms(a));
  }

  private filterTerms(item: any): boolean {
    const search = this.vm.search.toLowerCase();
    if (item.title && item.title.toLowerCase().includes(search)) return true;
    if (item.description && item.description.toLowerCase().includes(search)) return true;
    if (item.location_string && item.location_string.toLowerCase().includes(search)) return true;
    return false;
  }

  rslClick(rslId: string) {
    this.vm.isActionSheetOpen = true;
    this.vm.rslId = rslId;
  }

  groupClick(gevent: Event) {
    console.log(gevent);
    const points: MapPoint[] = [];
    let thisGroup = false;
    for (const event of this.vm.events) {
      if (event.group == gevent.group) {
        thisGroup = true;
      } else if (event.group) {
        thisGroup = false;
      }
      if (thisGroup) {
        points.push(
          toMapPoint(
            event.location,
            { title: event.title, location: event.location, subtitle: event.longTimeString, imageUrl: event.imageUrl },
            event.pin,
          ),
        );
      }
    }

    this.displayPoints(points, `${gevent.group} Events`);
  }

  mapCamps() {
    const points: MapPoint[] = [];
    for (const camp of this.vm.camps) {
      points.push(
        toMapPoint(
          camp.location_string,
          { title: camp.name, location: camp.location_string!, subtitle: '', imageUrl: camp.imageUrl },
          camp.pin,
        ),
      );
    }
    this.displayPoints(points, 'Favorite Camps');
  }

  async mapArt() {
    const points: MapPoint[] = [];
    const gps = await this.geo.getPosition();
    for (const art of this.vm.art) {
      const imageUrl: string = art.images?.length > 0 ? art.images[0].thumbnail_url! : '';
      const mp = toMapPoint(
        art.location_string,
        { title: art.name, location: '', subtitle: '', imageUrl: imageUrl },
        art.pin,
      );
      if (art.location?.gps_latitude && art.location?.gps_longitude) {
        mp.gps = { lat: art.location.gps_latitude, lng: art.location.gps_longitude };
        const dist = distance(gps, mp.gps);
        mp.info!.subtitle = formatDistanceMiles(dist);
      }
      points.push(mp);
    }
    this.displayPoints(points, 'Favorite Art');
  }

  private async displayPoints(points: MapPoint[], title: string) {
    const gpsPoints = await this.db.setMapPointsGPS(points);
    this.fav.setMapPointsTitle(title);
    this.fav.setMapPoints(gpsPoints);
    this.router.navigate(['tabs/favs/map']);
  }

  ngOnInit() {
    this.db.checkInit();
  }

  async mapEvent(event: Event) {
    const mp = toMapPoint(event.location, undefined, event.pin);
    mp.gps = await this.db.getMapPointGPS(mp);
    this.vm.mapPoints = [mp];
    this.vm.mapTitle = event.title;
    this.vm.mapSubtitle = event.location;
    this.vm.showMap = true;
  }

  public async removeEvent(event: Event) {
    const occurrence = this.fav.selectOccurrence(event, this.db.selectedDay());
    if (event.slug && event.slug.startsWith('rsl')) {
      const favs = await this.fav.getFavorites();
      const items = await this.fav.getRSLEventList(favs.rslEvents);
      for (const rslEvent of items) {
        for (const occurrence of rslEvent.occurrences) {
          console.log(this.fav.rslId(rslEvent, occurrence), event.slug);
          if (this.fav.rslId(rslEvent, occurrence) == event.slug) {
            await this.fav.starRSLEvent(false, rslEvent, occurrence);
          }
        }
      }
    } else {
      await this.fav.starEvent(false, event, this.db.selectedDay(), occurrence);
    }
  }

  async mapCamp(camp: Camp) {
    const mp = toMapPoint(camp.location_string!, undefined, camp.pin);
    mp.gps = await this.db.getMapPointGPS(mp);
    this.vm.mapPoints = [mp];
    this.vm.mapTitle = camp.name;
    this.vm.mapSubtitle = camp.location_string!;
    this.vm.showMap = true;
  }

  async removeCamp(camp: Camp) {
    await this.fav.starCamp(false, camp.uid);
    await this.update();
  }

  async removeArt(art: Art) {
    await this.fav.starArt(false, art.uid);
    await this.update();
  }

  eventsTrackBy(index: number, event: Event) {
    return event.uid;
  }

  campsTrackBy(index: number, camp: Camp) {
    return camp.uid;
  }

  artTrackBy(index: number, art: Art) {
    return art.uid;
  }

  filterChanged() {
    this.update();
  }

  async syncCalendar() {
    this.calendarUrl = await this.generateCalendar(this.vm.events);
    this.vm.showCalendarMessage = true;
    this._change.detectChanges();
  }

  async launchCalendar() {
    window.open(this.calendarUrl, "_blank");
    await this.ui.presentToast(
      `${this.vm.events.length} events synced with your ${this.db.selectedDataset().title} calendar.`,
      this.toastController,
    );
    this._change.detectChanges();
  }

  async generateCalendar(events: Event[]): Promise<string> {
    const list: string[] = [];
    this.vm.showCalendarMessage = false;
    this._change.detectChanges();
    for (const event of events) {
      list.push(event.title);
      const location = event.location ? ` (${event.location})` : '';
      this.calendar.add({
        calendar: this.db.selectedDataset().title,
        name: event.title,
        description: event.description,
        start: event.occurrence_set[0].start_time,
        end: event.occurrence_set[0].end_time,
        location: event.camp + location,
        timeZone: this.db.selectedDataset().timeZone,
      });
    }
    return await this.calendar.launch();
  }
}
