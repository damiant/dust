import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
  IonAlert,
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
    IonAlert,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private toastController = inject(ToastController);
  private streetService = inject(StreetService);
  private _change = inject(ChangeDetectorRef);
  noAddress = 'Choose Address';
  deleting = false;
  friend: Friend = { name: '', notes: '', address: this.noAddress };
  isEdit: boolean = false;
  public deleteButtons = [
    {
      text: 'Delete',
      role: 'confirm',
      handler: () => {},
    },
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {},
    },
  ];

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
        this._change.markForCheck();
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
    this.deleting = true;
  }

  confirmDelete(ev: any) {
    this.deleting = false;
    if (ev.detail.role !== 'confirm') return;
    return this.modalCtrl.dismiss(this.friend, FriendResult.delete);
  }
}
