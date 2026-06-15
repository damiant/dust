import { AfterViewInit, Component, ElementRef, viewChild, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-carousel-item',
  templateUrl: './carousel-item.component.html',
  styleUrls: ['./carousel-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class CarouselItemComponent implements AfterViewInit {
  item = viewChild.required<ElementRef>('item');

  width = 0;

  ngAfterViewInit() {
    this.width = this.item().nativeElement.clientWidth;
  }
}
