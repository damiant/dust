import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../db.service';
import { Event } from '../models';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { MapComponent, MapPoint, toMapPoint } from '../map/map.component';
import { FavoritesService } from '../favorites.service';

@Component({
  selector: 'app-event',
  templateUrl: './event.page.html',
  styleUrls: ['./event.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MapModalComponent, MapComponent]
})
export class EventPage implements OnInit {
  public event: Event | undefined;
  public back = signal('Back');
  showMap = false;
  mapPoints: MapPoint[] = [];
  mapTitle = '';
  mapSubtitle = '';
  @Input() eventId: string | undefined;
  constructor(private route: ActivatedRoute, private db: DbService, private fav: FavoritesService) {
  }

  async ngOnInit() {
    this.db.checkInit();
    const eventId = this.eventId ? this.eventId + '+' : this.route.snapshot.paramMap.get('id');

    let tmp = eventId?.split('+');

    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.back.set(tmp[1]);
    this.event = await this.db.findEvent(id);
    this.event.star = this.fav.isFavEvent(this.event.uid);
    this.mapTitle = this.event.camp;
    this.mapSubtitle = this.event.location;
    this.mapPoints.push(toMapPoint(this.event.location));    
  }

  star() {
    if (!this.event) return;
    this.event.star = !this.event?.star;
    this.fav.starEvent(this.event.star, this.event.uid);

  }

}
