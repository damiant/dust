import { Component, OnInit, effect, viewChild, inject, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonTitle,
  IonFooter,
  IonFab,
  IonFabButton,
  IonToggle,
  IonToolbar,
  ToastController,
  IonFabList,
  IonModal, IonSpinner, IonText,
  Platform,
  AlertController, IonLoading
} from '@ionic/angular/standalone';
import { UiService } from '../ui/ui.service';
import { Share } from '@capacitor/share';
import { Router, RouterModule } from '@angular/router';
import { FriendsComponent } from '../friends/friends.component';
import { SettingsService } from '../data/settings.service';
import { GPSPin, MapService } from '../map/map.service';
import { DbService } from '../data/db.service';
import { TileContainerComponent } from '../tile-container/tile-container.component';
import { TileComponent } from '../tile/tile.component';
import { GeoService } from '../geolocation/geo.service';
import { DatasetResult, Event, Link, LocationEnabledStatus, Names, Thing } from '../data/models';
import { environment } from 'src/environments/environment';
import { InAppReview } from '@capacitor-community/in-app-review';
import { PrivateEventsComponent } from '../private-events/private-events.component';
import { addIcons } from 'ionicons';
import {
  linkOutline,
  mailUnreadOutline,
  shareOutline,
  starHalfOutline,
  informationCircleOutline,
  exitOutline,
  timeOutline,
  locateOutline,
  compassOutline,
  calendarOutline,
  cloudDownloadOutline,
  closeSharp,
  ellipsisVerticalSharp,
  searchSharp,
} from 'ionicons/icons';
import { Animation, StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { getCachedImage } from '../data/cache-store';
import { LinkComponent } from '../link/link.component';
import { CalendarService } from '../calendar.service';
import { EventsCardComponent } from '../events-card/events-card.component';
import { FavoritesService } from '../favs/favorites.service';
import { ApiService } from '../data/api.service';
import { delay } from '../utils/utils';
import { PinsCardComponent } from '../pins-card/pins-card.component';
import { UpdateService } from '../update.service';

interface Group {
  id: number;
  links: Link[];
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonLoading, IonText,
    IonSpinner,
    IonModal,
    IonFabList,
    CommonModule,
    FormsModule,
    RouterModule,
    FriendsComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonBadge,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonIcon,
    IonToggle,
    IonFooter,
    IonFabButton,
    IonFab,
    TileContainerComponent,
    TileComponent,
    EventsCardComponent,
    PrivateEventsComponent,
    PinsCardComponent,
    LinkComponent,
  ],
})
export class ProfilePage implements OnInit {
  private ui = inject(UiService);
  private settings = inject(SettingsService);
  private map = inject(MapService);
  private geo = inject(GeoService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private favs = inject(FavoritesService);
  private calendar = inject(CalendarService);
  private router = inject(Router);
  private updateService = inject(UpdateService);
  public db = inject(DbService);
  moreClicks = 0;
  moreOpen = false;
  rated = false;
  locationEnabled = false;
  longEvents = false;
  hiddenPanel = false;
  downloading = false;
  directionsOpen = false;
  eventIsHappening = false;
  favEventsToday: Event[] = [];
  imageUrl = '';
  mapPin: GPSPin | undefined;
  groups: Group[] = [];
  things: Thing[] = [];
  ionContent = viewChild.required(IonContent);
  ionModal = viewChild.required(IonModal);
  hasMedical = true;
  hasRestrooms = true;
  hasIce = true;
  presentingElement: any;
  download: WritableSignal<string> = signal('');
  directionText: WritableSignal<string> = signal('');
  api = inject(ApiService);
  platform = inject(Platform);
  constructor() {
    addIcons({
      linkOutline,
      mailUnreadOutline,
      shareOutline,
      starHalfOutline,
      informationCircleOutline,
      compassOutline,
      calendarOutline,
      exitOutline,
      timeOutline,
      locateOutline,
      cloudDownloadOutline,
      closeSharp,
      ellipsisVerticalSharp,
      searchSharp
    });
    effect(() => {
      this.ui.scrollUpContent('profile', this.ionContent());
    });
    effect(async () => {
      this.favs.changed();
      await this.update();
    });
    effect(() => {
      const things = this.favs.things();
      this.things = things;
    });
    effect(async () => {
      const resumed = this.db.resume();
      if (resumed.length > 0) {
        await this.update();
      }
    });
  }

  async ngOnInit() {
    await this.init();
  }

  async init() {
    this.presentingElement = document.querySelector('.ion-page');
    this.imageUrl = await getCachedImage(this.db.selectedImage());
    this.db.checkInit();
    const summary: DatasetResult = await this.db.get(this.settings.settings.datasetId, Names.summary, {
      onlyRead: true,
    });
    this.hasRestrooms = this.hasValue(summary.pinTypes, 'Restrooms');
    this.hasMedical = this.hasValue(summary.pinTypes, 'Medical');
    this.hasIce = this.hasValue(summary.pinTypes, 'Ice');
    this.mapPin = this.getMapPin();
    this.longEvents = this.settings.settings.longEvents;
    this.eventIsHappening = !this.db.eventHasntBegun() && !this.db.isHistorical();
    this.locationEnabled = this.settings.settings.locationEnabled == LocationEnabledStatus.Enabled;
    this.groups = this.group(await this.db.getLinks());
    await this.favs.getThings();
    this.things = this.favs.things();
  }

  async update() {
    this.favEventsToday = await this.favs.getFavoriteEventsToday();
  }

  clickThing(thing: Thing) {
    this.router.navigateByUrl(`/map/things/${thing.name}`);
  }

  private group(links: Link[]): Group[] {
    let groups: Group[] = [];
    let group: Group = { id: 1, links: [] };
    for (const link of links) {
      if (link.title.startsWith('#')) {
        link.title = link.title.substring(1);
        if (group.links.length > 0) {
          // Start a new group
          groups.push(group);
          group = { id: group.id + 1, links: [] };
        }
        group.links.push(link);
      } else {
        group.links.push(link);
      }
    }
    groups.push(group);
    return groups;
  }

  hasValue(v: Record<string, number>, property: string): boolean {
    return v && v.hasOwnProperty(property) && v[property] > 0;
  }

  visit(url: string) {
    this.ui.openUrl(url);
  }

  async moreClick() {
    this.moreClicks++;
    if (this.moreClicks == 5) {
      this.ui.presentToast('Locations now enabled', this.toastController);
      environment.overrideLocations = true;
      this.settings.save();
      this.db.setLocationAvailable({ art: false, camps: false, artMessage: '', campMessage: '' });
      await this.db.populate(this.settings.settings.datasetId, this.db.getTimeZone());
      this.db.resume.set(new Date().toString());
    }
  }

  home() {
    this.favs.newFavs.set(0);
    this.settings.settings.preventAutoStart = true;
    this.ui.home();
  }

  search() {
    this.router.navigateByUrl('/search');
  }

  public async rate() {
    await this.dismiss();
    this.rated = true;
    await InAppReview.requestReview();
  }

  async share() {
    await this.dismiss();
    await Share.share({
      title: 'Dust in Curious Places',
      text: 'Check out the dust app for Burning Man events, art and theme camps.',
      url: 'https://dust.events/',
      dialogTitle: 'Share dust with friends',
    });
  }

  async addCalendar() {
    await this.dismiss();
    const success = await this.calendar.add({
      calendar: this.db.selectedDataset().title,
      name: this.db.selectedDataset().title,
      location: ' ',
      start: this.db.selectedDataset().start,
      end: this.db.selectedDataset().end,
      timeZone: this.db.selectedDataset().timeZone,
      description: '', // Need to get this from storage
      lat: this.db.selectedDataset().lat,
      lng: this.db.selectedDataset().long,
    });
    if (success) {
      const device = (this.platform.is('iphone') || this.platform.is('android')) ? 'phone' : 'device';
      this.ui.presentToast(`${this.db.selectedDataset().title} has been added to your ${device}'s calendar.`, this.toastController);
    }
  }

  async about() {
    await this.dismiss();
    this.router.navigateByUrl('/about');
  }

  async feedback() {
    await this.dismiss();
    // This is not working. Seems to require href instead
    // const url = 'mailto:damian@dust.events';
    // this.ui.openUrl(url);
  }

  async dismiss() {
    await this.ionModal().dismiss();
  }


  async ionViewWillEnter() {
    if (Capacitor.isNativePlatform() && !this.ui.isAndroid()) {
      await StatusBar.hide({ animation: Animation.Fade });
    }
  }

  async ionViewWillLeave() {
    if (Capacitor.isNativePlatform() && !this.ui.isAndroid()) {
      await StatusBar.show({ animation: Animation.Fade });
    }
  }

  private getMapPin(): GPSPin | undefined {
    if (this.settings.settings.dataset?.lat) {
      return { lat: this.settings.settings.dataset.lat, long: this.settings.settings.dataset.long };
    } else {
      if (!this.settings.settings.dataset?.lat) {
        // Golden Spike at Burning Man
        return { lat: 40.786969, long: -119.204101 };
      } else {
        return undefined;
      }
    }
  }

  private getDirectionText(): string {
    return this.settings.settings.dataset?.directions ?? '';
  }

  async directions() {
    // Default comes from https://burningman.org/event/preparation/getting-there-and-back/
    if (!this.mapPin) return;
    if (this.getDirectionText()) {
      this.directionText.set(this.getDirectionText());
      this.directionsOpen = true;
      return;
    }
    if (await this.map.canOpenMapApp('google')) {
      await this.map.openGoogleMapDirections(this.mapPin);
    } else if (await this.map.canOpenMapApp('apple')) {
      await this.map.openAppleMapDirections(this.mapPin);
    }
  }

  async downloadUpdate() {
    try {
      await this.dismiss();
      this.downloading = true;
      if (this.db.networkStatus() == 'none') {
        this.ui.presentToast('No network connection. Maybe turn off airplane mode?', this.toastController);
        return;
      }
      await delay(1000);
      const dataset = this.db.selectedDataset();
      const result = await this.api.download(dataset, false, this.download);

      switch (result) {
        case 'success': {
          this.downloading = false;
          this.ui.presentToast('Update complete', this.toastController);
          this.home();
          return;
        }
        case 'already-updated': {
          this.ui.presentToast('You have the latest camps, events & art for this event', this.toastController);
          this.updateService.checkVersion(this.alertController);
        }
      }
    } finally {

      this.downloading = false;
    }
  }
}
