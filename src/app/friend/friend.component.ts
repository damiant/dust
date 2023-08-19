import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Friend } from '../data/models';


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
export class FriendComponent implements OnInit {
  noAddress = 'Choose Address';
  friend: Friend = { name: '', notes: '', address: this.noAddress };
  isEdit: boolean = false;

  public addresses: any;
  private allStreets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'Esplanade'];
  private allHours = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];
  private allMinutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

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
    for (let street of this.allStreets) {

      streets.push({ text: street, value: street });
    }

    const hours: Array<PickerItem> = [];
    for (let hour of this.allHours) {

      hours.push({ text: hour, value: hour });
    }

    const minutes: Array<PickerItem> = [];
    for (let minute of this.allMinutes) {

      minutes.push({ text: minute, value: minute });
    }
    
    this.addresses = [
      { name: 'hour', options: hours },
      { name: 'minute', options: minutes, value: '20' },
      { name: 'street', options: streets, value: 'Esplanade' },
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

  ngOnInit(): void {
    const t = this.friend.address.split('&');
    const street = t[1].trim();
    const t2 = t[0].split(':');
    const hour = t2[0];
    const minutes = t2[1];    
    this.addresses[0].selectedIndex = this.allHours.indexOf(hour);
    this.addresses[1].selectedIndex = this.allMinutes.indexOf(minutes);
    this.addresses[2].selectedIndex = this.allStreets.indexOf(street);
  }

  deleteFriend() {
    return this.modalCtrl.dismiss(this.friend, FriendResult.delete);
    
  }

}
