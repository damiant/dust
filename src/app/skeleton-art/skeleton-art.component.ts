import { Component } from '@angular/core';
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
  imports: [IonCard, IonCardHeader, IonSkeletonText, IonCardContent, IonCardTitle, IonCardSubtitle],
})
export class SkeletonArtComponent {}
