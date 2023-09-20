import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { UiService } from '../ui/ui.service';
import { Share } from '@capacitor/share';
import { Router, RouterModule } from '@angular/router';
import { FriendsComponent } from '../friends/friends.component';
import { SettingsService } from '../data/settings.service';
import { MapService } from '../map/map.service';
import { DbService } from '../data/db.service';
import { TileContainerComponent } from '../tile-container/tile-container.component';
import { TileComponent } from '../tile/tile.component';
import { GeoService } from '../geolocation/geo.service';
import { LocationEnabledStatus } from '../data/models';
import { environment } from 'src/environments/environment';
import { RateApp } from 'capacitor-rate-app';
import { PrivateEventsComponent } from '../private-events/private-events.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, FriendsComponent,
    TileContainerComponent, TileComponent, PrivateEventsComponent]
})
export class ProfilePage implements OnInit {

  moreClicks = 0;
  rated = false;
  locationEnabled = false;
  longEvents = false;
  hiddenPanel = false;

  constructor(
    private ui: UiService,
    private settings: SettingsService,
    private map: MapService,
    private geo: GeoService,
    private toastController: ToastController,
    public db: DbService
  ) { }

  ngOnInit() {
    this.db.checkInit();
    this.longEvents = this.settings.settings.longEvents;
    this.locationEnabled = this.settings.settings.locationEnabled == LocationEnabledStatus.Enabled;
  }

  ionViewDidEnter() {

  }

  async moreClick() {
    this.moreClicks++;
    if (this.moreClicks == 5) {
      this.ui.presentToast('Locations now enabled', this.toastController);
      environment.overrideLocations = true;
      this.settings.settings.lastDownload = '';
      this.settings.save();
      this.db.setHideLocations(false);      
      await this.db.init(this.settings.settings.dataset);
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
    this.settings.settings.locationEnabled = this.locationEnabled ? LocationEnabledStatus.Enabled : LocationEnabledStatus.Disabled;
    this.settings.save();
  }

  async directions() {
    // From: https://burningman.org/event/preparation/getting-there-and-back/
    const pin = { lat: 40.753842, long: -119.277000 };
    if (await this.map.canOpenMapApp('google')) {
      await this.map.openGoogleMapDirections(pin);
    } else if (await this.map.canOpenMapApp('apple')) {
      await this.map.openAppleMapDirections(pin);
    }
  }

}
