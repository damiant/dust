import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-carousel-item',
  templateUrl: './carousel-item.component.html',
  styleUrls: ['./carousel-item.component.scss'],
  standalone: true,
})
export class CarouselItemComponent implements AfterViewInit {

  @ViewChild('item') item!: ElementRef;

  width = 0;

  ngAfterViewInit() {
    this.width = this.item.nativeElement.clientWidth;
  }

}
