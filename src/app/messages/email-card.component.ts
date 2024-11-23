import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonText, IonFabButton
} from '@ionic/angular/standalone';
import { Email } from '../message/emails';
import { addIcons } from 'ionicons';
import { checkmarkOutline } from 'ionicons/icons';
import { FadeOut } from '../ui/animation';


export type ArtImageStyle = 'top' | 'side' | 'none';

@Component({
  selector: 'app-email-card',
  templateUrl: './email-card.component.html',
  styleUrls: ['./email-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  animations: [FadeOut(500)],
  imports: [IonFabButton,
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonText,
    IonIcon,
  ],
})
export class EmailCardComponent {
  email = input.required<Email>();
  out = signal(false);
  read = output();

  constructor() {
    addIcons({ checkmarkOutline });
  }

  markAsRead() {
    this.out.set(true);
    this.read.emit();
  }

}
