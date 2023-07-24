import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../db.service';
import { Camp } from '../models';
import { MapComponent, MapPoint, toMapPoint } from '../map/map.component';

@Component({
  selector: 'app-camp',
  templateUrl: './camp.page.html',
  styleUrls: ['./camp.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MapComponent]
})
export class CampPage implements OnInit {

  camp: Camp | undefined;
  mapPoints: MapPoint[] = [];
  constructor(private route: ActivatedRoute, private db: DbService) {
  }

  async ngOnInit() {
    this.db.checkInit();
    const tmp = this.route.snapshot.paramMap.get('id')?.split('+');
    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.camp = await this.db.findCamp(id);
    this.mapPoints = [toMapPoint(this.camp.location_string!)];
    console.log(this.camp);
  }

  open(url: string) {
    window.open(url, '_system', 'location=yes');
  }

}
