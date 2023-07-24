import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../db.service';
import { Event } from '../models';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { MapComponent, MapPoint, toMapPoint } from '../map/map.component';

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
  constructor(private route: ActivatedRoute, private db: DbService) {     
  }

  async ngOnInit() {
    this.db.checkInit();
    const tmp = this.route.snapshot.paramMap.get('id')?.split('+');
    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.back.set(tmp[1]);
    this.event = await this.db.findEvent(id);
    this.mapTitle = this.event.camp;
    this.mapSubtitle = this.event.location;
    this.mapPoints.push(toMapPoint(this.event.location));
    console.log(this.event);
  }

}
