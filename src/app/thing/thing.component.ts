import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { Thing } from '../data/models';
import { addIcons } from 'ionicons';
import { add, person } from 'ionicons/icons';

export enum ThingResult {
  confirm = 'confirm',
  cancel = 'cancel',
  delete = 'delete',
}

@Component({
  selector: 'app-thing',
  templateUrl: './thing.component.html',
  styleUrls: ['./thing.component.scss'],
  imports: [FormsModule, IonItem, IonButton, IonContent, IonButtons, IonToolbar, IonTitle, IonInput, IonHeader],
})
export class ThingComponent {
  private modalCtrl = inject(ModalController);
  private toastController = inject(ToastController);
  thing: Thing = { name: '', notes: '' };
  isEdit: boolean = false;

  constructor() {
    addIcons({ add, person });
  }

  cancel() {
    return this.modalCtrl.dismiss(null, ThingResult.cancel);
  }

  confirm() {
    if (this.thing.name.length == 0) {
      this.presentToast(`Specify name`);
      return;
    }
    return this.modalCtrl.dismiss(this.thing, ThingResult.confirm);
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      color: 'primary',
      duration: 1500,
      swipeGesture: 'vertical',
      position: 'bottom',
    });

    await toast.present();
  }

  deleteThing() {
    return this.modalCtrl.dismiss(this.thing, ThingResult.delete);
  }
}
