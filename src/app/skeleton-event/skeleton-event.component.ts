import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonSkeletonText,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-skeleton-event',
  templateUrl: './skeleton-event.component.html',
  styleUrls: ['./skeleton-event.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonSkeletonText, IonCardContent],
})
export class SkeletonEventComponent {}
