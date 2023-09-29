import { Component, Input, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonPopover, IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DbService } from '../data/db.service';
import { Event, MapPoint, OccurrenceSet } from '../data/models';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { MapComponent } from '../map/map.component';
import { FavoritesService } from '../favs/favorites.service';
import { ShareInfoType } from '../share/share.service';
import { SettingsService } from '../data/settings.service';
import { UiService } from '../ui/ui.service';
import { toMapPoint } from '../map/map.utils';
import { dateMatches, noDate, sameDay } from '../utils/utils';
import { animate, state, style, transition, trigger } from '@angular/animations';


@Component({
  selector: 'app-event',
  templateUrl: './event.page.html',
  styleUrls: ['./event.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, FormsModule, MapModalComponent, MapComponent],
  animations: [
    trigger('fade', [ 
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('0.3s ease-in-out')),
    ])
  ]
})
export class EventPage implements OnInit {
  public event: Event | undefined;
  public back = signal('Back');
  @ViewChild(IonPopover) popover!: IonPopover;
  isOpen = false;
  ready = false;
  isReady = false; // Image
  showMap = false;
  mapPoints: MapPoint[] = [];
  mapTitle = '';
  mapSubtitle = '';
  campDescription = '';
  private day: Date | undefined;
  @Input() eventId: string | undefined;
  constructor(
    private route: ActivatedRoute,
    private db: DbService,
    private fav: FavoritesService,
    private settings: SettingsService,
    private ui: UiService,
    private toastController: ToastController) {
  }

  async ngOnInit() {
    this.db.checkInit();
    try {
      this.ready = false;
      const eventId = this.eventId ? this.eventId + '+' : this.route.snapshot.paramMap.get('id');

      let tmp = eventId?.split('+');

      if (!tmp) throw new Error('Route error');
      const id = tmp[0];

      this.back.set(tmp[1]);
      this.event = await this.db.findEvent(id);
      this.mapTitle = this.event.camp;
      this.mapSubtitle = this.event.location;
      const mapPoint = toMapPoint(this.event.location,
        { title: this.event.title, location: this.event.location, subtitle: this.event.camp });
      if (this.event.pin) {
        mapPoint.x = this.event.pin.x;
        mapPoint.y = this.event.pin.y;
      } else {
        mapPoint.gps = await this.db.getMapPointGPS(mapPoint);
      }
      this.mapPoints.push(mapPoint);
      const selectedDay = this.db.selectedDay();
      this.event.occurrence_set = this.event.occurrence_set.filter((o) => {
        if (!sameDay(selectedDay, noDate()) && !dateMatches(selectedDay, o)) {
          return false;
        }
        return !o.old;
      });
      await this.fav.setEventStars(this.event);
    } finally {
      this.ready = true;
    }
  }

  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      color: 'primary',
      duration: 3500,
      position: 'bottom',
    });

    await toast.present();
  }
  
  setReady() {
    this.isReady = true;    
  }

  async showCamp(e: any) {
    this.popover.event = e;
    const camp = await this.db.findCamp(this.event?.hosted_by_camp!);
    if (camp) {
      this.campDescription = camp.description!;
      this.isOpen = true;
    }
  }

  noop() {
  }

  share() {
    const url = `https://dust.events?${ShareInfoType.event}=${this.event?.uid}`;
    this.ui.share({
      title: this.event?.title,
      dialogTitle: this.event?.title,
      text: `Check out ${this.event?.title} at ${this.event?.camp} (${this.event?.location}) ${this.settings.eventTitle()} using the dust app.`,
      url
    });
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
