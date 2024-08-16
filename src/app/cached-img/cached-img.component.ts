import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, input, inject, output } from '@angular/core';
import { getCachedImage } from '../data/cache-store';

export type ImageLocation = 'top' | 'bottom';

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
  standalone: true,
})
export class CachedImgComponent {
  private _change = inject(ChangeDetectorRef);
  _src: string | undefined;
  alt = input<string>('');
  src = input<string>();
  isReady = false;
  loading = input('lazy');
  errorImage = input<string>('./assets/error-img.png');
  loaded = output<boolean>()

  constructor() {
    effect(async () => {
      const src = this.src();
      if (src) {
        try {
          this._src = await getCachedImage(src);
          this._change.markForCheck();
        } catch (e) {
          this.errored();
        }
      }
    });
  }

  ready() {
    this._change.markForCheck();
    this.isReady = true;
    this.loaded.emit(true);
  }

  errored() {
    this._src = this.errorImage();
    this.isReady = true;
    this._change.markForCheck();
  }
}
