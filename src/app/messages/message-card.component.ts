import { ChangeDetectionStrategy, Component, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonText, IonAvatar, IonFabButton
} from '@ionic/angular/standalone';
import { Item } from '../message/mastodon-feed';
import { addIcons } from 'ionicons';
import { checkmarkOutline } from 'ionicons/icons';
import { FadeIn, FadeOut } from '../ui/animation';
import { delay } from '../utils/utils';

export type ArtImageStyle = 'top' | 'side' | 'none';

@Component({
  selector: 'app-message-card',
  templateUrl: './message-card.component.html',
  styleUrls: ['./message-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  animations: [FadeOut(500), FadeIn(300)],  
  imports: [IonFabButton, 
    IonAvatar,
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonText,
    IonIcon,
  ]
})
export class MessageCardComponent implements OnInit {
  item = input.required<Item>();
  read = output();
  hideImage = signal(false);
  out = signal(false);
  in = signal(false);

  constructor() {
    addIcons({ checkmarkOutline });
  }

  async ngOnInit() {
    await delay(500);
    this.in.set(true);
  }

  markAsRead() {
    this.out.set(true);
    this.read.emit();
  }

}
