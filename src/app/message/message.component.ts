import { Component, input, model, output } from '@angular/core';
import { IonButton, IonIcon, IonModal, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
  standalone: true,
  imports: [IonModal, IonButton, IonText, IonIcon],
})
export class MessageComponent {
  show = model(false);

  message = input('');
  title = input('');
  dismissed = output<void>();
  constructor() {
    addIcons({ arrowForwardOutline });
  }

  close() {
    this.show.set(false);
  }

  dismiss() {
    this.close();
    this.dismissed.emit();
  }
}
