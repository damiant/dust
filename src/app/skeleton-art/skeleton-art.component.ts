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
  selector: 'app-skeleton-art',
  templateUrl: './skeleton-art.component.html',
  styleUrls: ['./skeleton-art.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonCard, IonCardHeader, IonSkeletonText, IonCardContent, IonCardTitle, IonCardSubtitle],
})
export class SkeletonArtComponent {}
