import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MapComponent, MapPoint } from '../map/map.component';
import { DbService } from '../db.service';
import { Pin } from '../models';

@Component({
  selector: 'app-pin-map',
  templateUrl: './pin-map.page.html',
  styleUrls: ['./pin-map.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MapComponent]
})
export class PinMapPage implements OnInit {
  points: MapPoint[] = [];
  constructor(private db: DbService) { }

  ngOnInit() {
  }

  async ionViewWillEnter() {
    const pins = await this.db.getPotties();
    this.points = this.pinsToMapPoints(pins);
    console.log(this.points);
  }

  private pinsToMapPoints(pins: Pin[]): MapPoint[] {
    const points: MapPoint[] = [];
    for (const pin of pins) {
       points.push({street: '', clock: '', x: pin.x, y: pin.y, info: {title: 'Restroom', location: 'Tip: At night, look for the blue light on poles marking porta potty banks.', subtitle: ''} });
    }
    return points;
  }

}
