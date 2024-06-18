import { Component, input, model, output } from '@angular/core';
import { IonButton, IonIcon, IonModal, IonText, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
  standalone: true,
  imports: [IonButtons, IonModal, IonButton, IonText, IonIcon],
})
export class MessageComponent {
  show = model(false);
  secondButton = input('');

  message = input('');
  title = input('');
  dismissed = output<boolean>();
  constructor() {
    addIcons({ arrowForwardOutline });
  }

  close() {
    this.show.set(false);
  }

  dismiss(okPressed: boolean) {
    this.close();
    this.dismissed.emit(okPressed);
  }
}
