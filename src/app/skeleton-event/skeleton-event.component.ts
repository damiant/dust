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
  selector: 'app-skeleton-event',
  templateUrl: './skeleton-event.component.html',
  styleUrls: ['./skeleton-event.component.scss'],
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonSkeletonText,
    IonCardContent]
})
export class SkeletonEventComponent { }
