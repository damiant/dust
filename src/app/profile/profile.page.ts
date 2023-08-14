import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { UiService } from '../ui.service';
import { Share } from '@capacitor/share';
import { Router, RouterModule } from '@angular/router';
import { FriendsComponent } from '../friends/friends.component';
import { SettingsService } from '../settings.service';
import { MapService } from '../map.service';
import { DbService } from '../db.service';
import { TileContainerComponent } from '../tile-container/tile-container.component';
import { TileComponent } from '../tile/tile.component';
import { GeoService } from '../geo.service';
import { LocationEnabledStatus } from '../models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, FriendsComponent,
    TileContainerComponent, TileComponent]
})
export class ProfilePage implements OnInit {

  moreClicks = 0;
  locationEnabled = false;

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
    this.locationEnabled = this.settings.settings.locationEnabled == LocationEnabledStatus.Enabled;
  }

  ionViewDidEnter() {

  }

  async moreClick() {
    this.moreClicks++;
    if (this.moreClicks == 5) {
      this.ui.presentToast('Locations now enabled', this.toastController);
      this.db.setHideLocations(false);
      await this.db.init(this.settings.settings.dataset);
    }
  }



  home() {
    this.settings.clearSelectedEvent();
    this.ui.home();
  }

  async share() {
    await Share.share({
      title: 'Dust in Curious Places',
      text: 'Check out the dust app for Burning Man events, art and theme camps.',
      url: 'https://dust.events/',
      dialogTitle: 'Share dust with friends',
    });
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
