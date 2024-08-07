import { Component, OnInit, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonItem,
  IonLabel,
  IonInput,
  IonModal,
  IonPickerLegacy,
  IonTitle,
  IonToolbar,
  ModalController,
  PickerColumn,
  ToastController,
} from '@ionic/angular/standalone';
import { PrivateEvent } from '../data/models';
import { FormsModule } from '@angular/forms';
import { StreetService } from '../map/street.service';
import { CommonModule } from '@angular/common';
import { now, uniqueId } from '../utils/utils';

export enum PrivateEventResult {
  confirm = 'confirm',
  cancel = 'cancel',
  delete = 'delete',
}

@Component({
  selector: 'app-private-event',
  templateUrl: './private-event.component.html',
  styleUrls: ['./private-event.component.scss'],
  imports: [
    FormsModule,
    CommonModule,
    IonItem,
    IonButton,
    IonLabel,
    IonModal,
    IonDatetimeButton,
    IonDatetime,
    IonPickerLegacy,
    IonContent,
    IonInput,
    IonButtons,
    IonButton,
    IonHeader,
    IonTitle,
    IonToolbar,
  ],
  standalone: true,
})
export class PrivateEventComponent implements OnInit {
  private streetService = inject(StreetService);
  private modalCtrl = inject(ModalController);
  private toastController = inject(ToastController);
  noAddress = 'Choose Address';
  dtReady = false;
  initialTime = now().toISOString();
  public addresses: PickerColumn[];
  public isEdit = false;
  public startEvent = new Date(new Date().getFullYear(), 7, 20).toISOString();
  public endEvent = new Date(new Date().getFullYear(), 8, 10).toISOString();

  event: PrivateEvent = {
    title: '',
    id: uniqueId('pe'),
    start: this.initialTime,
    address: this.noAddress,
    notes: '',
  };
  constructor() {
    this.addresses = this.streetService.getAddresses();
  }

  public pickerButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
    },
    {
      text: 'Confirm',
      handler: (value: any) => {
        this.event.address = `${value.hour.value}:${value.minute.value} & ${value.street.value}`;
      },
    },
  ];

  ngOnInit() {
    this.streetService.setAddress(this.event.address, this.addresses);
    setTimeout(() => { this.dtReady = true }, 300);
  }

  cancel() {
    return this.modalCtrl.dismiss(null, PrivateEventResult.cancel);
  }

  confirm() {
    if (this.event.title.length == 0) {
      this.presentToast(`Specify name`);
      return;
    }
    if (this.event.address == this.noAddress) {
      this.presentToast(`Select an address`);
      return;
    }
    if (this.event.start == this.initialTime) {
      this.presentToast(`Select a date and time when the event starts`);
      return;
    }
    return this.modalCtrl.dismiss(this.event, PrivateEventResult.confirm);
  }

  deleteEvent() {
    return this.modalCtrl.dismiss(this.event, PrivateEventResult.delete);
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
}
