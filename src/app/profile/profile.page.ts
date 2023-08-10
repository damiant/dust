import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
import { UiService } from '../ui.service';
import { Share } from '@capacitor/share';
import { Router, RouterModule } from '@angular/router';
import { FriendsComponent } from '../friends/friends.component';
import { SettingsService } from '../settings.service';
import { MapService } from '../map.service';
import { DbService } from '../db.service';
import { TileContainerComponent } from '../tile-container/tile-container.component';
import { TileComponent } from '../tile/tile.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, FriendsComponent,
     TileContainerComponent, TileComponent]
})
export class ProfilePage implements OnInit {

  constructor(
    private ui: UiService,
    private settings: SettingsService,
    private map: MapService,
    public db: DbService
  ) { }

  ngOnInit() {
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
