import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonText, IonAvatar, IonButton, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { Item } from '../message/mastodon-feed';
import { addIcons } from 'ionicons';
import { checkmarkOutline } from 'ionicons/icons';
import { FadeOut } from '../ui/animation';

export type ArtImageStyle = 'top' | 'side' | 'none';

@Component({
  selector: 'app-message-card',
  templateUrl: './message-card.component.html',
  styleUrls: ['./message-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  animations: [FadeOut(500)],  
  imports: [IonFabButton, IonFab, IonButton, IonAvatar,
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    CachedImgComponent,
    IonText,
    IonIcon,
  ]
})
export class MessageCardComponent {
  item = input.required<Item>();
  read = output();
  hideImage = signal(false);
  out = signal(false);

  constructor() {
    addIcons({ checkmarkOutline });
  }

  markAsRead() {
    this.out.set(true);
    this.read.emit();
  }

}
