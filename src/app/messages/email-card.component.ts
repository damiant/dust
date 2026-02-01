import { ChangeDetectionStrategy, Component, input, output, signal, computed } from '@angular/core';

import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonButton,
  IonText,
} from '@ionic/angular/standalone';
import { Email } from '../message/emails';
import { addIcons } from 'ionicons';
import { FadeOut } from '../ui/animation';
import { formatRelativeTime } from '../utils/date-utils';

export type ArtImageStyle = 'top' | 'side' | 'none';

@Component({
  selector: 'app-email-card',
  templateUrl: './email-card.component.html',
  styleUrls: ['./email-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [FadeOut(500)],
  imports: [IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonText],
})
export class EmailCardComponent {
  email = input.required<Email>();
  out = signal(false);
  read = output();
  formattedDate = computed(() => formatRelativeTime(this.email().date));

  constructor() {
    addIcons({});
  }

  markAsRead() {
    this.out.set(true);
    this.read.emit();
  }
}
