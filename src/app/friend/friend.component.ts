import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, PickerColumn, ToastController } from '@ionic/angular';
import { Friend } from '../data/models';
import { StreetService } from '../map/street.service';

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

  constructor(private modalCtrl: ModalController, private toastController: ToastController, private streetService: StreetService) {
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
