import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonPickerLegacy,
  IonTitle,
  IonToolbar,
  ModalController,
  PickerColumn,
  ToastController,
} from '@ionic/angular/standalone';
import { Friend } from '../data/models';
import { StreetService } from '../map/street.service';
import { addIcons } from 'ionicons';
import { add, person } from 'ionicons/icons';

export enum FriendResult {
  confirm = 'confirm',
  cancel = 'cancel',
  delete = 'delete',
}

@Component({
  selector: 'app-friend',
  templateUrl: './friend.component.html',
  styleUrls: ['./friend.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonItem,
    IonButton,
    IonPickerLegacy,
    IonContent,
    IonButtons,
    IonToolbar,
    IonTitle,
    IonInput,
    IonHeader,
  ],
  standalone: true,
})
export class FriendComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private toastController = inject(ToastController);
  private streetService = inject(StreetService);
  noAddress = 'Choose Address';
  friend: Friend = { name: '', notes: '', address: this.noAddress };
  isEdit: boolean = false;

  public addresses: PickerColumn[];

  public pickerButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
    },
    {
      text: 'Confirm',
      handler: (value: any) => {
        this.friend.address = `${value.hour.value}:${value.minute.value} & ${value.street.value}`;
      },
    },
  ];

  constructor() {
    addIcons({ add, person });
    this.addresses = this.streetService.getAddresses();
  }

  cancel() {
    return this.modalCtrl.dismiss(null, FriendResult.cancel);
  }

  confirm() {
    if (this.friend.name.length == 0) {
      this.presentToast(`Specify name`);
      return;
    }
    if (this.friend.address == this.noAddress) {
      this.presentToast(`Select an address`);
      return;
    }
    return this.modalCtrl.dismiss(this.friend, FriendResult.confirm);
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

  ngOnInit(): void {
    this.streetService.setAddress(this.friend.address, this.addresses);
  }

  deleteFriend() {
    return this.modalCtrl.dismiss(this.friend, FriendResult.delete);
  }
}
