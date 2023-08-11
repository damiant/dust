import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Art, Image, MapPoint } from '../models';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DbService } from '../db.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MapComponent } from '../map/map.component';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { FavoritesService } from '../favorites.service';
import { UiService } from '../ui.service';
import { SettingsService } from '../settings.service';
import { ShareInfoType } from '../share.service';
import { toMapPoint } from '../map/map.utils';

@Component({
  selector: 'app-art-item',
  templateUrl: './art-item.page.html',
  styleUrls: ['./art-item.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, MapComponent, MapModalComponent],
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('0.3s ease-in-out')),
    ])
  ]
})
export class ArtItemPage implements OnInit {
  art: Art | undefined;
  showMap = false;
  mapPoints: MapPoint[] = [];
  mapTitle = '';
  mapSubtitle = '';
  backText = 'Art';
  star = false;

  constructor(
    private route: ActivatedRoute,
    private ui: UiService,
    private db: DbService, 
    private settings: SettingsService,
    private fav: FavoritesService) {
  }

  async ngOnInit() {
    this.db.checkInit();
    const tmp = this.route.snapshot.paramMap.get('id')?.split('+');
    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.backText = tmp[1];
    this.art = await this.db.findArt(id);
    this.mapTitle = this.art.name;
    this.mapSubtitle = this.art.location_string!;
    this.mapPoints.push(toMapPoint(this.art.location_string!));
    this.star = await this.fav.isFavArt(this.art.uid);
  }

  map() {
    this.showMap = true;
  }

  ready(image: Image) {
    image.ready = true;
  }

  async toggleStar() {
    if (!this.art) return;
    this.star = !this.star;
    await this.fav.starArt(this.star, this.art.uid);
  }

  share() {
    const url = `https://dust.events?${ShareInfoType.art}=${this.art?.uid}`;
    this.ui.share({
      title: this.art?.name,
      dialogTitle: this.art?.name,
      text: `Check out ${this.art?.name} at ${this.settings.eventTitle()} using the dust app: ${url}`,
      url: this.art?.images[0].thumbnail_url
      //url: `https://dust.events/art/${this.art?.uid}`
    });
  }


}
