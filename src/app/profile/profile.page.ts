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
  ToastController,
} from '@ionic/angular/standalone';
import { UiService } from '../ui/ui.service';
import { Share } from '@capacitor/share';
import { RouterModule } from '@angular/router';
import { FriendsComponent } from '../friends/friends.component';
import { SettingsService } from '../data/settings.service';
import { GPSPin, MapService } from '../map/map.service';
import { DbService } from '../data/db.service';
import { TileContainerComponent } from '../tile-container/tile-container.component';
import { TileComponent } from '../tile/tile.component';
import { GeoService } from '../geolocation/geo.service';
import { Link, LocationEnabledStatus } from '../data/models';
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
} from 'ionicons/icons';
import { Animation, StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
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
  ],
})
export class ProfilePage implements OnInit {
  moreClicks = 0;
  rated = false;
  locationEnabled = false;
  longEvents = false;
  hiddenPanel = false;
  mapPin: GPSPin | undefined;
  links: Link[] = [];
  @ViewChild(IonContent) ionContent!: IonContent;

  constructor(
    private ui: UiService,
    private settings: SettingsService,
    private map: MapService,
    private geo: GeoService,
    private toastController: ToastController,
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
      closeSharp
    });
    effect(() => {
      this.ui.scrollUpContent('profile', this.ionContent);
    });
  }

  async ngOnInit() {
    this.db.checkInit();
    this.mapPin = this.getMapPin();
    this.longEvents = this.settings.settings.longEvents;
    this.locationEnabled = this.settings.settings.locationEnabled == LocationEnabledStatus.Enabled;    
    this.links = await this.db.getLinks();    
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
      await this.db.init(this.settings.settings.datasetId);
      this.db.resume.set(new Date().toString());
    }
  }

  home() {
    this.settings.clearSelectedEvent();
    this.ui.home();
  }

  public rate() {
    this.rated = true;
    RateApp.requestReview();
  }

  async share() {
    await Share.share({
      title: 'Dust in Curious Places',
      text: 'Check out the dust app for Burning Man events, art and theme camps.',
      url: 'https://dust.events/',
      dialogTitle: 'Share dust with friends',
    });
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
