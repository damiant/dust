import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Friend } from '../models';


interface PickerItem {
  text: string,
  value: string
}

export enum FriendResult {
  confirm = 'confirm',
  cancel = 'cancel',
  delete = 'delete'
}

@Component({
  selector: 'app-friend',
  templateUrl: './friend.component.html',
  styleUrls: ['./friend.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
  standalone: true
})
export class FriendComponent {
  noAddress = 'Choose Address';
  friend: Friend = { name: '', notes: '', address: this.noAddress };
  isEdit: boolean = false;

  public addresses: any;

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

  constructor(private modalCtrl: ModalController, private toastController: ToastController) {
    const streets: Array<PickerItem> = [];
    for (let street of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'Esplanade']) {

      streets.push({ text: street, value: street });
    }

    const hours: Array<PickerItem> = [];
    for (let hour of ['2', '3', '4', '5', '6', '7', '8', '9', '10']) {

      hours.push({ text: hour, value: hour });
    }

    const minutes: Array<PickerItem> = [];
    for (let minute of ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']) {

      minutes.push({ text: minute, value: minute });
    }

    this.addresses = [
      { name: 'hour', options: hours },
      { name: 'minute', options: minutes },
      { name: 'street', options: streets },
    ];
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
      position: 'bottom',
    });

    await toast.present();
  }

  deleteFriend() {
    return this.modalCtrl.dismiss(this.friend, FriendResult.delete);
  }

}
