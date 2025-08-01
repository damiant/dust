import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Art, Event, MapPoint } from '../data/models';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DbService } from '../data/db.service';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { FavoritesService } from '../favs/favorites.service';
import { UiService } from '../ui/ui.service';
import { SettingsService } from '../data/settings.service';
import { ShareInfoType } from '../share/share.service';
import { toMapPoint } from '../map/map.utils';
import { getCachedAudio } from '../data/cache-store';
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
  IonText,
  IonToolbar,
  IonModal,
  IonProgressBar,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starOutline, shareOutline, personOutline, locateOutline, locationOutline, volumeHighOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { EventPage } from '../event/event.page';
import { canCreate } from '../map/map';

@Component({
  selector: 'app-art-item',
  templateUrl: './art-item.page.html',
  styleUrls: ['./art-item.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonModal,
    FormsModule,
    RouterModule,
    MapModalComponent,
    IonHeader,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonText,
    IonProgressBar,
    CachedImgComponent,
    EventPage
  ]
})
export class ArtItemPage implements OnInit {
  private route = inject(ActivatedRoute);
  private ui = inject(UiService);
  private db = inject(DbService);
  private settings = inject(SettingsService);
  private fav = inject(FavoritesService);
  private _change = inject(ChangeDetectorRef);
  private toastController = inject(ToastController);
  art: Art | undefined;
  showMap = false;
  mapPoints: MapPoint[] = [];
  events: Event[] = [];
  eventId: string | undefined;
  showEvent = false;
  mapTitle = '';
  mapSubtitle = '';
  backText = 'Art';
  hometown = '';
  star = false;
  cachedAudioUrl = signal<string | undefined>(undefined);
  audioLoading = signal(false);

  constructor() {
    addIcons({ star, starOutline, shareOutline, personOutline, locateOutline, locationOutline, volumeHighOutline, checkmarkCircleOutline });
  }

  async ngOnInit() {
    this.db.checkInit();
    const tmp = this.route.snapshot.paramMap.get('id')?.split('+');
    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.backText = tmp[1];
    this.art = await this.db.findArt(id);
    this.mapTitle = this.art.name;
    this.hometown = this.art.hometown ? `(${this.art.hometown})` : '';
    this.mapSubtitle = this.art.location_string!;
    const pin = this.art.pin;
    let point = toMapPoint(this.art.location_string!, undefined, pin);
    if (this.art.location?.gps_latitude && this.art.location?.gps_longitude) {
      const gps = { lng: this.art.location.gps_longitude, lat: this.art.location.gps_latitude };
      point = await this.db.gpsToMapPoint(gps, undefined);
    }
    this.events = await this.db.getArtEvents(id);
    point.info = { title: this.art.name, subtitle: '', location: '', id: this.art.uid };
    this.mapPoints.push(point);

    // Handle audio caching
    await this.setupAudio();

    this.star = await this.fav.isFavArt(this.art.uid);
    this._change.markForCheck();
  }

  private async setupAudio() {
    if (!this.art?.audio) return;
    
    try {
        // Online: try to cache audio for future offline use
        this.audioLoading.set(true);
        try {
          const cachedUrl = await getCachedAudio(this.art.audio);
          this.cachedAudioUrl.set(cachedUrl);
        } catch (error) {
          console.warn('Failed to cache audio, using original URL:', error);
          this.cachedAudioUrl.set(this.art.audio);
        }
      
    } catch (error) {
      console.error('Error setting up audio:', error);
      // Fallback to original behavior
      if (this.db.networkStatus() === 'none') {
        this.art.audio = undefined;
      } else {
        this.cachedAudioUrl.set(this.art.audio);
      }
    } finally {
      this.audioLoading.set(false);
    }
  }

  open(url: string) {
    this.ui.openUrl(url);
  }

  show(event: Event) {
    this.eventId = event.uid;
    this.showEvent = true;
  }

  map() {
    if (this.db.artLocationsHidden()) {
      this.ui.presentDarkToast(`Art locations cannot be displayed yet. ${this.db.locationsHidden().artMessage}.`, this.toastController);
      return;
    }
    if (!canCreate()) return;
    this.showMap = true;
  }

  async toggleStar() {
    if (!this.art) return;
    this.star = !this.star;
    await this.fav.starArt(this.star, this.art.uid);
  }

  mailArtist() {
    if (!this.art?.contact_email) return;
    window.open('mailto:' + this.art?.contact_email);
  }

  share() {
    const url = `https://dust.events?${ShareInfoType.art}=${this.art?.uid}`;
    this.ui.share({
      title: this.art?.name,
      dialogTitle: this.art?.name,
      text: `Check out ${this.art?.name} at ${this.settings.eventTitle()} using the dust app: ${url}`,
      url: this.art?.images[0].thumbnail_url,
      //url: `https://dust.events/art/${this.art?.uid}`
    });
  }
}
