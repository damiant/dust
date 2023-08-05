import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MapComponent, MapPoint } from '../map/map.component';
import { FavoritesService } from '../favorites.service';

@Component({
  selector: 'app-fav-map',
  templateUrl: './fav-map.page.html',
  styleUrls: ['./fav-map.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MapComponent]
})
export class FavMapPage implements OnInit {

  points: MapPoint[] = [];
  constructor(private fav: FavoritesService) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.points = this.fav.getMapPoints();
  }

}
