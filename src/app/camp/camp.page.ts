import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../db.service';
import { Camp, Event, MapPoint } from '../models';
import { MapComponent } from '../map/map.component';
import { EventPage } from '../event/event.page';
import { FavoritesService } from '../favorites.service';
import { UiService } from '../ui.service';
import { SettingsService } from '../settings.service';
import { ShareInfoType } from '../share.service';
import { toMapPoint } from '../map/map.utils';

@Component({
  selector: 'app-camp',
  templateUrl: './camp.page.html',
  styleUrls: ['./camp.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MapComponent, EventPage]
})
export class CampPage implements OnInit {
  showEvent = false;
  camp: Camp | undefined;
  mapPoints: MapPoint[] = [];
  events: Event[] = [];
  eventId: string | undefined;
  star = false;
  backText = 'Camps';

  constructor(
    private route: ActivatedRoute,
    private db: DbService,
    private fav: FavoritesService,
    private settings: SettingsService,
    private ui: UiService) {
  }

  async ngOnInit() {
    this.db.checkInit();
    const tmp = this.route.snapshot.paramMap.get('id')?.split('+');
    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.backText = tmp[1];
    this.camp = await this.db.findCamp(id);
    this.star = await this.fav.isFavCamp(this.camp.uid);
    this.events = await this.db.getCampEvents(id);
    //this.mapPoints = [{x: this.camp.x, y: this.camp.y, street: '', clock: '', info: {title: this.camp.name, location: this.camp.location_string!, subtitle: ''}}];
    this.mapPoints = [toMapPoint(this.camp.location_string!,
      { title: this.camp.name, location: this.camp.location_string!, subtitle: '' })];
  }

  open(url: string) {
    window.open(url, '_system', 'location=yes');
  }

  show(event: Event) {
    this.eventId = event.uid;
    this.showEvent = true;
  }

  noop() {
  }

  share() {
    const url = `https://dust.events?${ShareInfoType.camp}=${this.camp?.uid}`;
    this.ui.share({
      title: this.camp?.name,
      dialogTitle: this.camp?.name,
      text: `Check out ${this.camp?.name} at ${this.settings.eventTitle()} using the dust app.`,
      url
    });
  }

  async toggleStar() {
    if (!this.camp) return;
    this.star = !this.star;
    await this.fav.starCamp(this.star, this.camp.uid);
  }

}
