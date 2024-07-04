import { Component, input, model, output } from '@angular/core';
import { IonButton, IonIcon, IonText, IonModal, IonInput } from "@ionic/angular/standalone";
import { decryptString } from '../utils/utils';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pin-entry',
  templateUrl: './pin-entry.component.html',
  styleUrls: ['./pin-entry.component.scss'],
  standalone: true,
  imports: [IonInput, IonModal, IonText, IonButton, IonIcon, FormsModule]
})
export class PinEntryComponent {
  show = model(false);
  dismissed = output<boolean>();
  correctPin = input<string>('');
  message = input<string>('A PIN is required to access this event. This is delivered by email or at greeters.');
  enteredPin = '';
  constructor() { }

  close() {
    this.show.set(false);
  }

  async dismiss() {
    this.close();
    this.dismissed.emit(await this.checkPin());
  }

  async checkPin(): Promise<boolean> {
    const correctPin = await decryptString(this.correctPin(), 'd1e0fa-b0b0-4b79-a6ca-8ffdf8be88');
    return correctPin == this.enteredPin;
  }

  async tryPin(modal: IonModal) {
    if (await this.checkPin()) {
      await modal.dismiss();
      await this.dismiss();
    } else {
      this.enteredPin = '';
    }
  }
}
