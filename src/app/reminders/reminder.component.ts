import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
  IonTextarea,
} from '@ionic/angular/standalone';
import { Reminder } from '../data/models';
import { FormsModule } from '@angular/forms';
import { StreetService } from '../map/street.service';
import { CommonModule } from '@angular/common';
import { now, uniqueId } from '../utils/utils';

export enum ReminderResult {
  confirm = 'confirm',
  cancel = 'cancel',
  delete = 'delete',
}

@Component({
    selector: 'app-reminder',
    templateUrl: './reminder.component.html',
    styleUrls: ['./reminder.component.scss'],
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
        IonTextarea
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReminderComponent implements OnInit {
  private streetService = inject(StreetService);
  private modalCtrl = inject(ModalController);
  private toastController = inject(ToastController);
  private _change = inject(ChangeDetectorRef);
  noAddress = 'Choose Address';
  dtReady = false;
  initialTime = now().toISOString();
  public addresses: PickerColumn[];
  public isEdit = false;
  public showAddress = true;
  public startEvent = '';
  public endEvent = '';
  public highlightedDates: any[] = [];

  public event: Reminder = {
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
        this._change.markForCheck();
      },
    },
  ];

  ngOnInit() {
    if (this.event?.address) {
      this.streetService.setAddress(this.event.address, this.addresses);
    }
    console.log(this.startEvent, this.endEvent);
    setTimeout(() => {
      this.dtReady = true;
      this._change.markForCheck();
    }, 300);
  }

  cancel() {
    return this.modalCtrl.dismiss(null, ReminderResult.cancel);
  }

  confirm() {
    if (this.event.title.length == 0) {
      this.presentToast(`Specify title`);
      return;
    }
    if (this.showAddress && this.event.address == this.noAddress) {
      this.presentToast(`Select an address`);
      return;
    }
    if (this.event.address == this.noAddress) {
      this.event.address = undefined;
    }
    if (this.event.start == this.initialTime) {
      this.presentToast(`Select a date and time when to receive the reminder`);
      return;
    }
    return this.modalCtrl.dismiss(this.event, ReminderResult.confirm);
  }

  deleteEvent() {
    return this.modalCtrl.dismiss(this.event, ReminderResult.delete);
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
