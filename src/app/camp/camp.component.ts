import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Camp } from '../data/models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  selector: 'app-camp',
  templateUrl: './camp.component.html',
  styleUrls: ['./camp.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IonCard, IonCardHeader, IonCardSubtitle, IonText, IonCardTitle, IonCardContent],
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('0.3s ease-in-out')),
    ]),
  ],
})
export class CampComponent {
  @Input() camp!: Camp;
  @Input() showImage = true;
  @Input() title = 'Camps';
  @Output() mapClick = new EventEmitter<any>();
  isReady = false;

  ready() {
    this.isReady = true;
  }

  map(camp: Camp) {
    console.log('emit', camp);
    this.mapClick.emit(camp);
  }
}
