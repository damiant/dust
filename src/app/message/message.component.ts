import { Component, effect, input, model, output } from '@angular/core';
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
  disabled = false;
  dismissed = output<boolean>();
  constructor() {
    addIcons({ arrowForwardOutline });
    effect(() => {
      const show = this.show();
      if (show) {
        this.disabled = true;
        setTimeout(() => {
          this.disabled = false;
        }, 500);
      }
    })
  }

  close() {
    if (this.disabled) return;
    this.show.set(false);
  }

  dismiss(okPressed: boolean) {
    this.close();
    this.dismissed.emit(okPressed);
  }
}
