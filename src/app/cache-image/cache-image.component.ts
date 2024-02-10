import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, effect, input } from '@angular/core';
import { CacheStoreService } from '../data/cache-store.service';

@Component({
  selector: 'app-cache-image',
  templateUrl: './cache-image.component.html',
  styleUrls: ['./cache-image.component.scss'],  
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('0.3s ease-in-out')),
    ]),
  ],
  standalone: true,

})
export class CacheImageComponent {
  _src: string | undefined;
  @Input() alt: string = '';
  src = input<string>();
  isReady = false;

  constructor(private cacheStoreService: CacheStoreService) {
    effect(async () => {
      const src = this.src();
      if (src) {
        this._src = await this.cacheStoreService.setImage(src);        
      }
    });
  }

  ready() {
    this.isReady = true;
  }




}
