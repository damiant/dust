import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Art } from '../data/models';
import { CommonModule } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonText,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-art',
  templateUrl: './art.component.html',
  styleUrls: ['./art.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonText],
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('0.3s ease-in-out')),
    ]),
  ],
})
export class ArtComponent {
  @Input() art!: Art;
  @Input() title = 'Art';
  @Input() showImage = true;
  @Output() artClick = new EventEmitter<Art>();
  isReady = false;
  constructor() {}

  ready() {
    this.isReady = true;
  }

  click() {
    this.artClick.emit(this.art);
  }
}
