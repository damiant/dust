import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal, effect, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Art, Event, MapPoint, RSLEvent, RSLOccurrence } from '../data/models';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ArtService, ArtChanged } from '../art/art.service';
import { DbService } from '../data/db.service';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { FavoritesService } from '../favs/favorites.service';
import { UiService } from '../ui/ui.service';
import { SettingsService } from '../data/settings.service';
import { toMapPoint } from '../map/map.utils';
import { MapPolygon } from '../map/map-model';
import { getCachedAudio } from '../data/cache-store';
import { Subscription } from 'rxjs';
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
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  star,
  starOutline,
  shareOutline,
  personOutline,
  locateOutline,
  locationOutline,
  volumeHighOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  chevronBackOutline,
} from 'ionicons/icons';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { EventPage } from '../event/event.page';
import { canCreate } from '../map/map';
import { buildCampMapFeatures } from '../map/camp-polygon.utils';
import { getOrdinalNum } from '../utils/utils';

@Component({
  selector: 'app-art-item',
  templateUrl: './art-item.page.html',
  styleUrls: ['./art-item.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonModal,
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
    EventPage,
  ],
})
export class ArtItemPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private ui = inject(UiService);
  private db = inject(DbService);
  private settings = inject(SettingsService);
  private fav = inject(FavoritesService);
  private _change = inject(ChangeDetectorRef);
  private toastController = inject(ToastController);
  private router = inject(Router);
  private artService = inject(ArtService);
  art: Art | undefined;
  showMap = false;
  mapPoints: MapPoint[] = [];
  partyShowMap = false;
  partyMapPoints: MapPoint[] = [];
  partyMapPolygons: MapPolygon[] = [];
  partyMapTitle = '';
  partyMapSubtitle = '';
  events: Event[] = [];
  rslEvents: RSLEvent[] = [];
  eventId: string | undefined;
  showEvent = false;
  mapTitle = '';
  mapSubtitle = '';
  backText = 'Art';
  hometown = '';
  private imageTaps = 0;
  star = false;
  cachedAudioUrl = signal<string | undefined>(undefined);
  audioLoading = signal(false);
  autoPlayAudio = signal(false);
  prevDisabled = false;
  nextDisabled = false;
  private artChangeSubscription?: Subscription;

  constructor() {
    addIcons({
      star,
      starOutline,
      shareOutline,
      personOutline,
      locateOutline,
      locationOutline,
      volumeHighOutline,
      checkmarkCircleOutline,
      chevronForwardOutline,
      chevronBackOutline,
    });
    effect(() => {
      const position = this.artService.position();
      this.prevDisabled = position == 'start';
      this.nextDisabled = position == 'end';
    });
  }

  async ngOnInit() {
    this.db.checkInit();
    const tmp = this.route.snapshot.paramMap.get('id')?.split('+');
    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.backText = tmp[1];
    this.art = await this.db.findArt(id);
    if (!this.art) {
      throw new Error('Art not found: ' + id);
      return;
    }
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

    const rslEvents = await this.db.getArtRSLEvents(id);
    const favs = await this.fav.getFavorites();
    this.fav.setFavorites(rslEvents, favs.rslEvents);
    for (const rsl of rslEvents) {
      rsl.camp = this.toDate(rsl.day);
    }
    this.rslEvents = rslEvents;

    this.star = await this.fav.isFavArt(this.art.uid);
    this._change.markForCheck();

    this.artChangeSubscription = this.artService.artChanged.subscribe(async (artChanged: ArtChanged) => {
      this.artService.currentArtId = artChanged.artId;
      await this.init(artChanged.artId);
      if (this.autoPlayAudio()) {
        await this.setupAudio(true);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.artChangeSubscription) {
      this.artChangeSubscription.unsubscribe();
    }
  }

  private async init(artId: string) {
    try {
      this.art = await this.db.findArt(artId);
      if (!this.art) return;
      this.mapTitle = this.art.name;
      this.hometown = this.art.hometown ? `(${this.art.hometown})` : '';
      this.mapSubtitle = this.art.location_string!;
      const pin = this.art.pin;
      let point = toMapPoint(this.art.location_string!, undefined, pin);
      if (this.art.location?.gps_latitude && this.art.location?.gps_longitude) {
        const gps = { lng: this.art.location.gps_longitude, lat: this.art.location.gps_latitude };
        point = await this.db.gpsToMapPoint(gps, undefined);
      }
      this.events = await this.db.getArtEvents(artId);
      const rslEvents = await this.db.getArtRSLEvents(artId);
      const favs = await this.fav.getFavorites();
      this.fav.setFavorites(rslEvents, favs.rslEvents);
      for (const rsl of rslEvents) {
        rsl.camp = this.toDate(rsl.day);
      }
      this.rslEvents = rslEvents;
      point.info = { title: this.art.name, subtitle: '', location: '', id: this.art.uid };
      this.mapPoints = [point];
      this.star = await this.fav.isFavArt(this.art.uid);
    } finally {
      this._change.markForCheck();
    }
  }

  private async setupAudio(autoPlay = false) {
    this.autoPlayAudio.set(autoPlay);
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
      if (this.autoPlayAudio() && this.art?.audio) {
        setTimeout(() => {
          const audio = document.querySelector('app-art-item audio') as HTMLAudioElement;
          if (audio) {
            audio.play().catch((e) => console.warn('Auto-play failed:', e));
          }
          this.autoPlayAudio.set(false);
        }, 100);
      }
    }
  }

  open(url: string) {
    this.ui.openUrl(url);
  }

  show(event: Event) {
    this.eventId = event.uid;
    this.showEvent = true;
  }

  public async toggleRSLStar(occurrence: RSLOccurrence, rslEvent: RSLEvent) {
    occurrence.star = !occurrence.star;
    const message = await this.fav.starRSLEvent(occurrence.star, rslEvent, occurrence);
    if (message) {
      this.ui.presentToast(message, this.toastController);
    }
  }

  rslInfo() {
    this.ui.presentToast(`To favorite these events press a name below.`, this.toastController);
  }

  // When a party has a location, tapping the title shows it on the map
  // (like the Music page); otherwise fall back to the favorites hint.
  partyTitleClick(event: RSLEvent) {
    if (event.location && event.location !== 'On The Playa') {
      this.partyMap(event);
    } else {
      this.rslInfo();
    }
  }

  public async partyMap(event: RSLEvent) {
    const camp = event.campId ? await this.db.findCamp(event.campId) : undefined;
    const features = camp
      ? await buildCampMapFeatures(camp, (gps) => this.db.gpsToPoint(gps), 0)
      : undefined;
    if (features) {
      this.partyMapPoints = [features.point];
      this.partyMapPolygons = features.polygon ? [features.polygon] : [];
    } else {
      const point = toMapPoint(event.location, undefined, event.pin);
      point.gps = await this.db.getMapPointGPS(point);
      this.partyMapPoints = [point];
      this.partyMapPolygons = [];
    }
    this.partyMapTitle = event.camp;
    this.partyMapSubtitle = event.location;
    this.partyShowMap = true;
    this._change.markForCheck();
  }

  // Party label: "Monday 31st", plus " - {title}" if a title exists,
  // otherwise " - {location}" if there's a meaningful location.
  partyLabel(event: RSLEvent): string {
    const suffix = event.title
      ? event.title
      : event.location && event.location !== 'On The Playa'
        ? event.location
        : '';
    return suffix ? `${event.camp} - ${suffix}` : event.camp;
  }

  // d is in the format of 2024-07-23
  private toDate(d: string): string {
    const t = d.split('-');
    const day = parseInt(t[2]);
    const date = new Date(parseInt(t[0]), parseInt(t[1]) - 1, parseInt(t[2]));
    return date.toLocaleDateString([], { weekday: 'long' }) + ` ${getOrdinalNum(day)}`;
  }

  map() {
    if (this.db.artLocationsHidden() && this.art?.art_type !== 'Mutant Vehicle') {
      this.ui.presentDarkToast(
        `Art locations cannot be displayed yet. ${this.db.locationsHidden().artMessage}.`,
        this.toastController,
      );
      return;
    }
    if (!canCreate()) return;
    this.showMap = true;
  }

  async tapImage() {
    this.imageTaps++;
    if (this.imageTaps > 2) {
      this.imageTaps = 0;
      if (this.art?.art_type == 'Mutant Vehicle') {
        // Route to broadcast page
        this.router.navigate(['/broadcast/' + this.art.uid + '+Art']);
      }
    }
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
    const url = `https://${this.settings.settings.dataset!.id}.dust.events/art/${this.art?.uid}`;
    this.ui.share({
      title: this.art?.name,
      dialogTitle: this.art?.name,
      text: `Check out ${this.art?.name} at ${this.settings.eventTitle()} using the dust app. `,
      url,
    });
  }

  next() {
    this.autoPlayAudio.set(true);
    this.artService.next.emit(`${this.art?.uid}`);
  }

  prev() {
    this.artService.prev.emit(`${this.art?.uid}`);
  }
}
