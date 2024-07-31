import { Component, OnInit, signal, input, viewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonText,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
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
import { addIcons } from 'ionicons';
import {
  shareOutline,
  locationOutline,
  timeOutline,
  star,
  starOutline,
  pricetagOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { CachedImgComponent, ImageLocation } from '../cached-img/cached-img.component';
import { canCreate } from '../map/map';

@Component({
  selector: 'app-event',
  templateUrl: './event.page.html',
  styleUrls: ['./event.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MapModalComponent,
    MapComponent,
    IonItem,
    IonButton,
    IonText,
    IonIcon,
    IonLabel,
    IonBadge,
    IonContent,
    IonList,
    IonButtons,
    IonToolbar,
    IonBackButton,
    IonHeader,
    IonPopover,
    CachedImgComponent,
  ],
})
export class EventPage implements OnInit {
  private route = inject(ActivatedRoute);
  private db = inject(DbService);
  private fav = inject(FavoritesService);
  private settings = inject(SettingsService);
  private ui = inject(UiService);
  private toastController = inject(ToastController);
  public event: Event | undefined;
  public back = signal('Back');
  popover = viewChild.required(IonPopover);
  content = viewChild.required(IonContent);
  isOpen = false;
  ready = false;
  showMap = false;
  mapPoints: MapPoint[] = [];
  mapTitle = '';
  mapSubtitle = '';
  campDescription = '';
  private day: Date | undefined;
  eventId = input<string>();
  filterDays = input<boolean>(true); // Whether to filter by day
  imageLocation = input<ImageLocation>('top');
  constructor() {
    addIcons({ shareOutline, locationOutline, timeOutline, star, starOutline, pricetagOutline, closeCircleOutline });
  }

  async ngOnInit() {
    this.db.checkInit();
    try {
      this.ready = false;
      const eventId = this.eventId() ? this.eventId()! + '+' : this.route.snapshot.paramMap.get('id');

      let tmp = eventId?.split('+');

      if (!tmp) throw new Error('Route error');
      const id = tmp[0];

      this.back.set(tmp[1]);
      this.event = await this.db.findEvent(id);
      this.mapTitle = this.event.camp;
      this.mapSubtitle = this.event.location;
      const mapPoint = toMapPoint(this.event.location, {
        title: this.event.title,
        location: this.event.location,
        subtitle: this.event.camp,
      });
      if (this.event.pin) {
        mapPoint.x = this.event.pin.x;
        mapPoint.y = this.event.pin.y;
      } else {
        mapPoint.gps = await this.db.getMapPointGPS(mapPoint);
      }
      this.mapPoints.push(mapPoint);
      const selectedDay = this.db.selectedDay();
      const occurrences = JSON.parse(JSON.stringify(this.event.occurrence_set));
      this.event.occurrence_set = occurrences.filter((o: any) => {
        const isNoDate = sameDay(selectedDay, noDate());
        const isSelectedDay = dateMatches(selectedDay, o);
        if (!isNoDate && !isSelectedDay) {
          if (this.filterDays()) {
            return false;
          }
        }
        return !o.old;
      });
      await this.fav.setEventStars(this.event);
    } finally {
      this.ready = true;
      this.showMap = canCreate();
    }
  }

  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      color: 'primary',
      duration: 3500,
      swipeGesture: 'vertical',
      position: 'bottom',
    });

    await toast.present();
  }

  closePopover() {
    this.isOpen = false;
  }

  async showCamp(e: any) {
    this.popover().event = e;
    const camp = await this.db.findCamp(this.event?.hosted_by_camp!);
    if (camp) {
      this.campDescription = camp.description!;
      this.isOpen = true;
    }
  }

  scrolled(deltaY: number) {
    console.log('scrolled on event', deltaY);
    if (deltaY > 100) {
      this.content().scrollToTop(500);
    }
  }

  noop() { }

  share() {
    const url = `https://dust.events?${ShareInfoType.event}=${this.event?.uid}`;
    this.ui.share({
      title: this.event?.title,
      dialogTitle: this.event?.title,
      text: `Check out ${this.event?.title} at ${this.event?.camp} (${this.event?.location
        }) ${this.settings.eventTitle()} using the dust app.`,
      url,
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
