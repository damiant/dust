import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() show = false;

  @Input() message = '';
  @Input() title = '';
  @Output() dismissed = new EventEmitter<void>();
  constructor() {
    addIcons({ arrowForwardOutline });
  }

  close() {
    this.show = false;
  }

  dismiss() {
    this.close();
    this.dismissed.emit();
  }
}
