import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, effect, input } from '@angular/core';
import { getCachedImage } from '../data/cache-store';

@Component({
  selector: 'app-cached-img',
  templateUrl: './cached-img.component.html',
  styleUrls: ['./cached-img.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('0.3s ease-in-out')),
    ]),
  ],
  standalone: true

})
export class CachedImgComponent {
  _src: string | undefined;
  @Input() alt: string = '';  
  src = input<string>();
  isReady = false;
  @Input() loading = 'lazy';

  constructor(private _change: ChangeDetectorRef) {
    effect(async () => {
      const src = this.src();
      if (src) {
        this._src = await getCachedImage(src);
        this._change.markForCheck();
      }
    });
  }

  ready() {
    this._change.markForCheck();
    this.isReady = true;
  }




}
