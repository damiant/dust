import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Art, MapPoint } from '../data/models';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DbService } from '../data/db.service';
import { MapComponent } from '../map/map.component';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { FavoritesService } from '../favs/favorites.service';
import { UiService } from '../ui/ui.service';
import { SettingsService } from '../data/settings.service';
import { ShareInfoType } from '../share/share.service';
import { toMapPoint } from '../map/map.utils';
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
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starOutline, shareOutline, personOutline, locateOutline, locationOutline } from 'ionicons/icons';
import { CachedImgComponent } from '../cached-img/cached-img.component';

@Component({
  selector: 'app-art-item',
  templateUrl: './art-item.page.html',
  styleUrls: ['./art-item.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonTitle,
    FormsModule,
    RouterModule,
    MapComponent,
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
    CachedImgComponent
  ]
})
export class ArtItemPage implements OnInit {
  art: Art | undefined;
  showMap = false;
  mapPoints: MapPoint[] = [];
  mapTitle = '';
  mapSubtitle = '';
  backText = 'Art';
  hometown = '';
  star = false;

  constructor(
    private route: ActivatedRoute,
    private ui: UiService,
    private db: DbService,
    private settings: SettingsService,
    private fav: FavoritesService,
  ) {
    addIcons({ star, starOutline, shareOutline, personOutline, locateOutline, locationOutline });
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
    console.log(point, pin);
    if (this.art.location?.gps_latitude && this.art.location?.gps_longitude) {
      const gps = { lng: this.art.location.gps_longitude, lat: this.art.location.gps_latitude };
      point = await this.db.gpsToMapPoint(gps, undefined);
    }
    point.info = { title: this.art.name, subtitle: '', location: '' };
    this.mapPoints.push(point);
    
    this.star = await this.fav.isFavArt(this.art.uid);
  }

  open(url: string) {
    this.ui.openUrl(url);
  }

  map() {
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
