import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MapComponent } from '../map/map.component';
import { DbService } from '../data/db.service';
import { MapPoint, MapSet, Pin } from '../data/models';

enum MapType {
  Restrooms = 'restrooms',
  Ice = 'ice',
  Medical = 'medical'
}

@Component({
  selector: 'app-pin-map',
  templateUrl: './pin-map.page.html',
  styleUrls: ['./pin-map.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MapComponent]
})
export class PinMapPage implements OnInit {
  @Input() mapType = '';
  points: MapPoint[] = [];
  title = '';
  description = '';
  constructor(private db: DbService) { }

  ngOnInit() {
  }

  async ionViewWillEnter() {
    const mapSet = await this.mapFor(this.mapType);
    this.points = mapSet.points;
    this.title = mapSet.title;
    this.description = mapSet.description;
  }



  private async mapFor(mapType: string): Promise<MapSet> {
    switch (mapType) {
      case MapType.Restrooms: {
        const pins = await this.db.getPotties();
        return { title: 'Restrooms', description: 'Tip: At night, look for the blue light on poles marking porta potty banks.', points: this.pinsToMapPoints(pins) };
      }
      case MapType.Ice: return await this.db.getMapPoints('ice');
      case MapType.Medical: return await this.db.getMapPoints('medical');
      default: return { title: '', description: '', points: [] };
    }
  }

  private pinsToMapPoints(pins: Pin[]): MapPoint[] {
    const points: MapPoint[] = [];
    for (const pin of pins) {
      points.push({ street: '', clock: '', x: pin.x, y: pin.y, info: { title: 'Restroom', location: '', subtitle: '' } });
    }
    return points;
  }

}
