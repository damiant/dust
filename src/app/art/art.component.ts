import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Art, Image } from '../models';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-art',
  templateUrl: './art.component.html',
  styleUrls: ['./art.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, CommonModule, RouterModule],
  animations: [
    trigger('fade', [ 
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('0.3s ease-in-out')),
    ])
  ]
})
export class ArtComponent implements OnInit {

  @Input() art!: Art;
  @Input() title = 'Art';
  @Input() showImage = true;
  isReady = false;
  constructor() { }

  ngOnInit() { }

  ready() {
    this.isReady = true;    
  }
}
