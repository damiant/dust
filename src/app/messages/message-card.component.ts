import { ChangeDetectionStrategy, Component, ElementRef, input, ViewChild, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonText, IonAvatar } from '@ionic/angular/standalone';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { Item } from '../message/mastodon-feed';

export type ArtImageStyle = 'top' | 'side' | 'none';

@Component({
  selector: 'app-message-card',
  templateUrl: './message-card.component.html',
  styleUrls: ['./message-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IonAvatar, 
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    CachedImgComponent,
    IonText,
    IonIcon,
  ],
})
export class MessageCardComponent {
  item = input.required<Item>();
  hideImage = false;

  constructor() {      
  }

}
