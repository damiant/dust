import { AfterViewInit, Component, ElementRef, OnDestroy, output, contentChildren, viewChild, input, computed } from '@angular/core';
import { CarouselItemComponent } from '../carousel-item/carousel-item.component';

export interface SlideSelect {
  index: number;
  scrollLeft: number;
}
@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  standalone: true,
})
export class CarouselComponent {
  slideChanged = output<SlideSelect>();
  private interval: any;
  private lastValue = -1;
  enabled = input<boolean>(false);
  children = contentChildren(CarouselItemComponent);
  container = viewChild.required<ElementRef>('container');

  public setScrollLeft(left: number) {
    setTimeout(() => {
      this.container().nativeElement.scrollLeft = left;
    }, 50);
  }

  private enableChanged = computed(() => {
    const enabled = this.enabled();
    if (enabled) {
      this.enable();
    } else {
      this.disable();
    }
  });

  private enable() {
    this.interval = setInterval(() => {
      const padding = parseInt(getComputedStyle(this.container().nativeElement).scrollPaddingLeft);
      const l = this.container().nativeElement.scrollLeft;
      let itemWidth = 200;
      this.children().map((c) => {
        itemWidth = c.width;
      });
      const current = Math.trunc((l + padding) / itemWidth);

      if (current !== this.lastValue) {
        this.slideChanged.emit({ index: current, scrollLeft: l });
        this.lastValue = current;
      }
    }, 1000);
  }

  private disable() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
