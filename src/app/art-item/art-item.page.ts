import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Art, Image } from '../models';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../db.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-art-item',
  templateUrl: './art-item.page.html',
  styleUrls: ['./art-item.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
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
  constructor(private route: ActivatedRoute, private db: DbService) {     
  }

  async ngOnInit() {
    const tmp = this.route.snapshot.paramMap.get('id')?.split('+');
    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.art = await this.db.findArt(id);

    console.log(this.art);
  }

  ready(image: Image) {
    image.ready = true;    
  }


}
