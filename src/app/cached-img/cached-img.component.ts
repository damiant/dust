import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, effect, input } from '@angular/core';
import { getCachedImage } from '../data/cache-store';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-cached-img',
  templateUrl: './cached-img.component.html',
  styleUrls: ['./cached-img.component.scss'],
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('0.3s ease-in-out')),
    ]),
  ],
  standalone: true,
  imports: [NgStyle]

})
export class CachedImgComponent {
  _src: string | undefined;
  @Input() alt: string = '';
  styles = input<Object>({});
  src = input<string>();
  isReady = false;

  constructor() {
    effect(async () => {
      const src = this.src();
      if (src) {
        this._src = await getCachedImage(src);
      }
    });
  }

  ready() {
    this.isReady = true;
  }




}
