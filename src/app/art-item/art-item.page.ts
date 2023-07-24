import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Art, Image } from '../models';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DbService } from '../db.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MapComponent, MapPoint } from '../map/map.component';
import { MapModalComponent } from '../map-modal/map-modal.component';

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
  constructor(private route: ActivatedRoute, private router: Router, private db: DbService) {     
  }

  async ngOnInit() {
    this.db.checkInit();
    const tmp = this.route.snapshot.paramMap.get('id')?.split('+');
    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.art = await this.db.findArt(id);
    this.mapPoints.push({ street: 'e', clock: '2:45'});
  }

  map() {
    this.showMap = true;    
  }

  ready(image: Image) {
    image.ready = true;    
  }


}
