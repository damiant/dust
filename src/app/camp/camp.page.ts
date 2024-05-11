import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonText,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../data/db.service';
import { Camp, Event, MapPoint, RSLEvent, RSLOccurrence } from '../data/models';
import { MapComponent } from '../map/map.component';
import { EventPage } from '../event/event.page';
import { FavoritesService } from '../favs/favorites.service';
import { UiService } from '../ui/ui.service';
import { SettingsService } from '../data/settings.service';
import { ShareInfoType } from '../share/share.service';
import { toMapPoint } from '../map/map.utils';
import { getOrdinalNum } from '../utils/utils';
import { addIcons } from 'ionicons';
import { star, starOutline, shareOutline, locationOutline, calendarOutline } from 'ionicons/icons';
import { CachedImgComponent } from '../cached-img/cached-img.component';

@Component({
  selector: 'app-camp',
  templateUrl: './camp.page.html',
  styleUrls: ['./camp.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MapComponent,
    EventPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonModal,
    CachedImgComponent,
  ],
})
export class CampPage implements OnInit {
  private route = inject(ActivatedRoute);
  private db = inject(DbService);
  private fav = inject(FavoritesService);
  private settings = inject(SettingsService);
  private toastController = inject(ToastController);
  private ui = inject(UiService);
  showEvent = false;
  camp: Camp | undefined;
  mapPoints: MapPoint[] = [];
  events: Event[] = [];
  eventId: string | undefined;
  rslEvents: RSLEvent[] = [];
  star = false;
  backText = 'Camps';

  constructor() {
    addIcons({ star, starOutline, shareOutline, locationOutline, calendarOutline });
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

    const rslEvents = await this.db.getCampRSLEvents(id);

    const favs = await this.fav.getFavorites();
    this.fav.setFavorites(rslEvents, favs.rslEvents);
    for (let rsl of rslEvents) {
      rsl.camp = this.toDate(rsl.day);
    }
    this.rslEvents = rslEvents;
    const mp = toMapPoint(
      this.camp.location_string!,
      { title: this.camp.name, location: this.camp.location_string!, subtitle: '', imageUrl: this.camp.imageUrl },
      this.camp.pin,
    );
    this.mapPoints = [mp];
  }

  public async toggleRSLStar(occurrence: RSLOccurrence, rslEvent: RSLEvent) {
    occurrence.star = !occurrence.star;
    const message = await this.fav.starRSLEvent(occurrence.star, rslEvent, occurrence);
    if (message) {
      this.ui.presentToast(message, this.toastController);
    }
  }

  private toDate(d: string): string {
    const t = d.split('-');
    const day = parseInt(t[2]);
    const date = new Date(`${d}T00:00:00`);
    return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) + ` ${getOrdinalNum(day)}`;
  }

  open(url: string) {
    this.ui.openUrl(url);
  }

  show(event: Event) {
    this.eventId = event.uid;
    this.showEvent = true;
  }

  noop() {}

  share() {
    const url = `https://dust.events?${ShareInfoType.camp}=${this.camp?.uid}`;
    this.ui.share({
      title: this.camp?.name,
      dialogTitle: this.camp?.name,
      text: `Check out ${this.camp?.name} at ${this.settings.eventTitle()} using the dust app.`,
      url,
    });
  }

  rslInfo() {
    this.ui.presentToast(`To favorite these events press a name below.`, this.toastController);
  }

  async toggleStar() {
    if (!this.camp) return;
    this.star = !this.star;
    await this.fav.starCamp(this.star, this.camp.uid);
  }
}
