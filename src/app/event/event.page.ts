import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../db.service';
import { Event, OccurrenceSet } from '../models';
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
  private day: Date | undefined;
  @Input() eventId: string | undefined;
  constructor(private route: ActivatedRoute, private db: DbService, private fav: FavoritesService, private toastController: ToastController) {
  }

  async ngOnInit() {
    this.db.checkInit();
    const eventId = this.eventId ? this.eventId + '+' : this.route.snapshot.paramMap.get('id');

    let tmp = eventId?.split('+');

    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    
    this.back.set(tmp[1]);
    this.event = await this.db.findEvent(id);
    this.mapTitle = this.event.camp;
    this.mapSubtitle = this.event.location;
    this.mapPoints.push(toMapPoint(this.event.location));
    for (let occurrence of this.event.occurrence_set) {
      occurrence.star = await this.fav.isFavEventOccurrence(this.event.uid, occurrence);
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      color: 'primary',
      duration: 1500,
      position: 'bottom',
    });

    await toast.present();
  }

  async toggleStar(occurrence: OccurrenceSet) {
    if (!this.event) return;
    occurrence.star = !occurrence.star;
    const message = await this.fav.starEvent(occurrence.star, this.event, this.db.selectedDay(), occurrence);
    if (message) {
      this.presentToast(message);
    }
  }
}
