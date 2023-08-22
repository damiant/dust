import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MapComponent } from '../map/map.component';
import { DbService } from '../data/db.service';
import { Art, MapPoint, MapSet, Pin } from '../data/models';
import { GpsCoord } from '../map/geo.utils';
import { GeoService } from '../geolocation/geo.service';
import { toMapPoint } from '../map/map.utils';

enum MapType {
  Restrooms = 'restrooms',
  Ice = 'ice',
  Art = 'art',
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
  smallPins: boolean = false;
  title = '';
  description = '';
  constructor(private db: DbService, private geo: GeoService) {
    this.db.checkInit();
  }

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
      case MapType.Art: return await this.getArt();
      case MapType.Restrooms: return await this.db.getGPSPoints('restrooms', 'Block of restrooms');
      case MapType.Ice: return await this.db.getMapPoints('ice');
      case MapType.Medical: return await this.db.getMapPoints('medical');
      default: return { title: '', description: '', points: [] };
    }
  }

  private async getArt(): Promise<MapSet> {
    let coords: GpsCoord | undefined = undefined;
    this.smallPins = true;
    coords = await this.geo.getPosition();

    const allArt = await this.db.findArts(undefined, coords);
    const points = [];
    for (let art of allArt) {
      if (art.location_string) {
        const point = await this.convertToPoint(art);
        if (point) points.push(point);
      }
    }
    return {
      title: 'Art',
      description: '',
      points
    }
  }

  private async convertToPoint(art: Art): Promise<MapPoint | undefined> {
    let point = toMapPoint(art.location_string!);
    if (point.street == 'unplaced') return undefined;
    if (art.location.gps_latitude && art.location.gps_longitude) {
      const gps = { lng: art.location.gps_longitude, lat: art.location.gps_latitude };
      point = await this.db.gpsToMapPoint(gps, undefined);
    }
    point.info = { title: art.name, subtitle: '', location: '', imageUrl: art.images[0].thumbnail_url }
    return point;
  }

}
