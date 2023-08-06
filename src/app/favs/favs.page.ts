import { Component, OnInit, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { Art, Camp, Event } from '../models';
import { FavoritesService } from '../favorites.service';
import { EventComponent } from '../event/event.component';
import { DbService } from '../db.service';
import { CampComponent } from '../camp/camp.component';
import { MapPoint, toMapPoint } from '../map/map.component';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { ArtComponent } from '../art/art.component';
import { UiService } from '../ui.service';
import { CategoryComponent } from '../category/category.component';
import { SearchComponent } from '../search/search.component';
import { sameDay } from '../utils';

enum Filter {
  All = '',
  Camps = 'Camps',
  Art = 'Art',
  Events = 'Events'
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

  filter = '';
  events: Event[] = [];
  camps: Camp[] = [];
  art: Art[] = [];
  filters = [Filter.Events, Filter.Camps, Filter.Art];

  showMap = false;
  noFavorites = false;
  mapTitle = '';
  search = '';
  mapSubtitle = '';
  mapPoints: MapPoint[] = [];
  @ViewChild(IonContent) ionContent!: IonContent;

  constructor(private fav: FavoritesService, private ui: UiService, public db: DbService,
    private router: Router) {
    effect(() => {
      console.log('update favorite');
      this.fav.changed();
      this.update();
    });

    effect(() => {
      this.ui.scrollUpContent('favs', this.ionContent);
    });
  }

  async ionViewWillEnter() {
    if (this.events.length == 0) {
      this.update();
    }
  }

  home() {
    this.ui.home();
  }

  searchFavs(value: string) {
    this.search = value;
    this.update();
  }

  private async update() {
    const favs = await this.fav.getFavorites();
    this.events = this.filterItems(Filter.Events, await this.fav.getEventList(favs.events, this.db.selectedYear() !== ''));
    this.camps = this.filterItems(Filter.Camps, await this.db.getCampList(favs.camps));
    this.art = this.filterItems(Filter.Art, await this.db.getArtList(favs.art));
    this.noFavorites = this.art.length == 0 && this.camps.length == 0 && this.events.length == 0;
  }

  private filterItems(filter: Filter, items: any[]): any[] {
    if (this.filter === filter || this.filter === Filter.All) {
      if (this.search) {
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
    const search = this.search.toLowerCase();
    if (item.title && item.title.toLowerCase().includes(search)) return true;
    if (item.description && item.description.toLowerCase().includes(search)) return true;
    if (item.print_description && item.print_description.toLowerCase().includes(search)) return true;
    if (item.location_string && item.location_string.toLowerCase().includes(search)) return true;
    return false;
  }

  groupClick(gevent: Event) {
    console.log(gevent);
    const points: MapPoint[] = [];
    let thisGroup = false;
    for (const event of this.events) {
      if (event.group == gevent.group) {
        thisGroup = true;
      } else if (event.group) {
        thisGroup = false;
      }
      if (thisGroup) {
        points.push(toMapPoint(event.location,
          { title: event.title, location: event.location, subtitle: event.longTimeString }));
      }
    }

    this.displayPoints(points, gevent.group!);
  }

  mapCamps() {
    const points: MapPoint[] = [];
    for (const camp of this.camps) {
      points.push(toMapPoint(camp.location_string,
        { title: camp.name, location: camp.location_string!, subtitle: '' }));
    }
    this.displayPoints(points, 'Favorite Camps');
  }

  mapArt() {
    const points: MapPoint[] = [];
    for (const art of this.art) {
      const imageUrl: string = art.images?.length > 0 ? art.images[0].thumbnail_url! : '';
      points.push(toMapPoint(art.location_string,
        { title: art.name, location: art.location_string!, subtitle: '', imageUrl: imageUrl }));
    }
    this.displayPoints(points, 'Favorite Art');
  }

  private displayPoints(points: MapPoint[], title: string) {
    this.fav.setMapPointsTitle(title);
    this.fav.setMapPoints(points);
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

  }

  mapEvent(event: Event) {
    this.mapPoints = [toMapPoint(event.location)];
    this.mapTitle = event.title;
    this.mapSubtitle = event.location;
    this.showMap = true;
  }

  mapCamp(camp: Camp) {
    this.mapPoints = [toMapPoint(camp.location_string!)];
    this.mapTitle = camp.name;
    this.mapSubtitle = camp.location_string!;
    this.showMap = true;
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
