import { Component, OnInit, ViewChild, effect } from '@angular/core';
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
  ToastController, IonFabList, IonModal
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
import { DatasetResult, Link, LocationEnabledStatus, Names } from '../data/models';
import { environment } from 'src/environments/environment';
import { RateApp } from 'capacitor-rate-app';
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
  closeSharp,
  ellipsisVerticalSharp
} from 'ionicons/icons';
import { Animation, StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { getCachedImage } from '../data/cache-store';
import { LinkComponent } from '../link/link.component';

interface Group {
  id: number;
  links: Link[];
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonModal, IonFabList,
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
    PrivateEventsComponent,
    LinkComponent
  ],
})
export class ProfilePage implements OnInit {
  moreClicks = 0;
  rated = false;
  locationEnabled = false;
  longEvents = false;
  hiddenPanel = false;
  imageUrl = '';
  mapPin: GPSPin | undefined;
  groups: Group[] = [];
  @ViewChild(IonContent) ionContent!: IonContent;
  @ViewChild(IonModal) ionModal!: IonModal;
  hasMedical = true;
  hasRestrooms = true;
  hasIce = true;
  presentingElement: any;

  constructor(
    private ui: UiService,
    private settings: SettingsService,
    private map: MapService,
    private geo: GeoService,
    private toastController: ToastController,
    private router: Router,
    public db: DbService,
  ) {
    addIcons({
      linkOutline,
      mailUnreadOutline,
      shareOutline,
      starHalfOutline,
      informationCircleOutline,
      compassOutline,
      exitOutline,
      timeOutline,
      locateOutline,
      closeSharp,
      ellipsisVerticalSharp
    });
    effect(() => {
      this.ui.scrollUpContent('profile', this.ionContent);
    });
  }

  async ngOnInit() {
    this.presentingElement = document.querySelector('.ion-page');
    this.imageUrl = await getCachedImage(this.db.selectedImage());
    this.db.checkInit();
    const summary: DatasetResult = await this.db.get(this.settings.settings.datasetId, Names.summary, { onlyRead: true });
    console.log('sujmary', summary.pinTypes);
    this.hasRestrooms = this.hasValue(summary.pinTypes, 'Restrooms');
    this.hasMedical = this.hasValue(summary.pinTypes, 'Medical');
    this.hasIce = this.hasValue(summary.pinTypes, 'Ice');
    this.mapPin = this.getMapPin();
    this.longEvents = this.settings.settings.longEvents;
    this.locationEnabled = this.settings.settings.locationEnabled == LocationEnabledStatus.Enabled;
    this.groups = this.group(await this.db.getLinks());
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
    return (v && v.hasOwnProperty(property) && v[property] > 0);
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
      this.db.setHideLocations(false);
      await this.db.populate(this.settings.settings.datasetId);
      this.db.resume.set(new Date().toString());
    }
  }

  home() {
    //this.settings.clearSelectedEvent();
    this.settings.settings.preventAutoStart = true;
    this.ui.home();
  }

  public async rate() {
    await this.dismiss();
    this.rated = true;
    RateApp.requestReview();
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

  async about() {
    await this.dismiss();
    this.router.navigateByUrl('/about');
  }

  async feedback() {
    await this.dismiss();
    const url = 'mailto:damian@dust.events?subject=dust';
    this.ui.openUrl(url);
  }

  async dismiss() {
    await this.ionModal.dismiss();
  }

  async toggleLongEvents(e: any) {
    this.longEvents = e.detail.checked;
    this.settings.settings.longEvents = this.longEvents;
    this.settings.save();
  }
  async toggleLocation(e: any) {
    const turnedOn = e.detail.checked;
    if (turnedOn) {
      const success = await this.geo.getPermission();
      if (success) {
        this.locationEnabled = turnedOn;
      }
    } else {
      this.locationEnabled = false;
    }
    this.settings.settings.locationEnabled = this.locationEnabled
      ? LocationEnabledStatus.Enabled
      : LocationEnabledStatus.Disabled;
    this.settings.save();
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
        return { lat: 40.753842, long: -119.277 };
      } else {
        return undefined;
      }
    }
  }

  async directions() {
    // Default comes from https://burningman.org/event/preparation/getting-there-and-back/    
    if (!this.mapPin) return;
    if (await this.map.canOpenMapApp('google')) {
      await this.map.openGoogleMapDirections(this.mapPin);
    } else if (await this.map.canOpenMapApp('apple')) {
      await this.map.openAppleMapDirections(this.mapPin);
    }
  }
}
