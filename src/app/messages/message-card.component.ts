import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonText, IonAvatar,
  IonButton
} from '@ionic/angular/standalone';
import { Item } from '../message/rss-feed';
import { addIcons } from 'ionicons';
import { checkmarkOutline } from 'ionicons/icons';
import { FadeIn, FadeOut } from '../ui/animation';
import { delay } from '../utils/utils';
import { UiService } from '../ui/ui.service';

export type ArtImageStyle = 'top' | 'side' | 'none';

@Component({
    selector: 'app-message-card',
    templateUrl: './message-card.component.html',
    styleUrls: ['./message-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [FadeOut(500), FadeIn(300)],
    imports: [
        IonAvatar,
        CommonModule,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardSubtitle,
        IonCardContent,
        IonText,
        IonButton
    ]
})
export class MessageCardComponent implements OnInit {
  item = input.required<Item>();
  read = output();
  hideImage = signal(false);
  out = signal(false);
  in = signal(false);
  ui = inject(UiService);

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

  open() {
    this.ui.openUrl(this.item().link);
  }

}
