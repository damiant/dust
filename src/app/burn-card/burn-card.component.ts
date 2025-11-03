import { Component, Input, input, output } from '@angular/core';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { Dataset } from '../data/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-burn-card',
  templateUrl: './burn-card.component.html',
  styleUrls: ['./burn-card.component.scss'],
  imports: [CommonModule, CachedImgComponent],
})
export class BurnCardComponent {
  loaded: any = {};
  selected = input<Dataset | undefined>();
  clicked = output<Dataset>();
  @Input() cards: Dataset[] = [];

  open(card: Dataset) {
    this.clicked.emit(card);
  }
}
