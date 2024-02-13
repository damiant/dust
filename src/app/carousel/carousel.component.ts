import { AfterViewInit, Component, ContentChildren, ElementRef, EventEmitter, OnDestroy, Output, QueryList, ViewChild } from '@angular/core';
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
export class CarouselComponent implements AfterViewInit, OnDestroy {

  @Output() slideChanged = new EventEmitter<SlideSelect>();
  private interval: any;
  private lastValue = -1;
  @ContentChildren(CarouselItemComponent) children!: QueryList<CarouselItemComponent>;
  @ViewChild('container') container!: ElementRef;

  public setScrollLeft(left: number) {
    setTimeout(() => { this.container.nativeElement.scrollLeft = left; }, 50);
  }

  constructor() { }

  ngAfterViewInit() {
    this.interval = setInterval(() => {
      const padding = parseInt(getComputedStyle(this.container.nativeElement).scrollPaddingLeft);
      const l = this.container.nativeElement.scrollLeft;
      let itemWidth = 200;
      this.children.map(c => {
        itemWidth = c.width;
      });
      const current = Math.trunc((l + padding) / itemWidth);

      if (current !== this.lastValue) {
        this.slideChanged.emit({ index: current, scrollLeft: l });
        this.lastValue = current;
      }

    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

}
