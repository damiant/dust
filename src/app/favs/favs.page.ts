import { Component, OnInit, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonicModule } from '@ionic/angular';
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

enum Filter {
  All = '',
  Camps = 'Camps',
  Art = 'Art',
  Events = 'Events'
}

interface FavsState {
  filter: string,
  events: Event[],
  camps: Camp[],
  art: Art[],
  filters: Filter[],
  showMap: boolean,
  noFavorites: boolean,
  mapTitle: string,
  search: string,
  mapSubtitle: string,
  rslId: string | undefined,
  isActionSheetOpen: boolean,
  mapPoints: MapPoint[]
}

function intitialState(): FavsState {
  return {
    filter: '',
    events: [],
    camps: [],
    art: [],
    filters: [Filter.Events, Filter.Camps, Filter.Art],
    showMap: false,
    noFavorites: false,
    mapTitle: '',
    search: '',
    mapSubtitle: '',
    rslId: undefined,
    isActionSheetOpen: false,
    mapPoints: []
  }
}

@Component({
  selector: 'app-favs',
  templateUrl: './favs.page.html',
  styleUrls: ['./favs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, EventComponent,
    CampComponent, MapModalComponent, ArtComponent, CategoryComponent, SearchComponent]
})
export class FavsPage implements OnInit {
  vm: FavsState = intitialState();

  @ViewChild(IonContent) ionContent!: IonContent;

  constructor(
    private fav: FavoritesService,
    private ui: UiService,
    private geo: GeoService,
    public db: DbService,
    private router: Router) {
    effect(() => {
      console.log('update favorite');
      this.fav.changed();
      this.update();
    });
    effect(() => {
      this.db.resume();
      this.update();
    });

    effect(() => {
      this.ui.scrollUpContent('favs', this.ionContent);
    });
    effect(() => {
      const status = this.db.networkStatus();
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
    // if (this.vm.events.length == 0) {
    //   console.log('ionViewWillEnter.update');
    //   this.update();
    // }
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
    const rslEvents = this.filterItems(Filter.Events, await this.fav.getRSLEventList(favs.rslEvents));
    const events = this.filterItems(Filter.Events, await this.fav.getEventList(favs.events, this.db.selectedYear() !== '', rslEvents));
    const camps = this.filterItems(Filter.Camps, await this.db.getCampList(favs.camps));
    const art = this.filterItems(Filter.Art, await this.db.getArtList(favs.art));
    this.vm.events = events;
    this.vm.camps = camps;
    this.vm.art = art;
    this.vm.noFavorites = this.vm.art.length == 0 && this.vm.camps.length == 0 && this.vm.events.length == 0;
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
    if (item.print_description && item.print_description.toLowerCase().includes(search)) return true;
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
        points.push(toMapPoint(event.location,
          { title: event.title, location: event.location, subtitle: event.longTimeString }, event.pin));

      }
    }

    this.displayPoints(points, `${gevent.group} Events`);
  }

  mapCamps() {
    const points: MapPoint[] = [];
    for (const camp of this.vm.camps) {
      points.push(toMapPoint(camp.location_string,
        { title: camp.name, location: camp.location_string!, subtitle: '' }, camp.pin));
    }
    this.displayPoints(points, 'Favorite Camps');
  }

  async mapArt() {
    const points: MapPoint[] = [];
    const gps = await this.geo.getPosition();
    for (const art of this.vm.art) {
      const imageUrl: string = art.images?.length > 0 ? art.images[0].thumbnail_url! : '';
      const mp = toMapPoint(art.location_string,
        { title: art.name, location: '', subtitle: '', imageUrl: imageUrl });
      if (art.location.gps_latitude && art.location.gps_longitude) {
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

  // map() {
  //   const points: MapPoint[] = [];
  //   for (const event of this.events) {
  //     points.push(toMapPoint(event.location,
  //       { title: event.title, location: event.location, subtitle: event.longTimeString }));
  //   }
  //   for (const art of this.art) {
  //     const imageUrl: string = art.images?.length > 0 ? art.images[0].thumbnail_url! : '';
  //     points.push(toMapPoint(art.location_string,
  //       { title: art.name, location: art.location_string!, subtitle: '', imageUrl: imageUrl }));
  //   }
  //   for (const camp of this.camps) {
  //     points.push(toMapPoint(camp.location_string,
  //       { title: camp.name, location: camp.location_string!, subtitle: '' }));
  //   }
  //   this.fav.setMapPoints(points);
  //   this.router.navigate(['tabs/favs/map']);
  // }
  ngOnInit() {
    this.db.checkInit();
  }

  async mapEvent(event: Event) {
    const mp = toMapPoint(event.location);
    mp.gps = await this.db.getMapPointGPS(mp);
    this.vm.mapPoints = [mp];
    this.vm.mapTitle = event.title;
    this.vm.mapSubtitle = event.location;
    this.vm.showMap = true;
  }

  async mapCamp(camp: Camp) {
    const mp = toMapPoint(camp.location_string!);
    mp.gps = await this.db.getMapPointGPS(mp);
    this.vm.mapPoints = [mp];
    this.vm.mapTitle = camp.name;
    this.vm.mapSubtitle = camp.location_string!;
    this.vm.showMap = true;
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
}
