import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, input } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonFabButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { FriendComponent } from '../friend/friend.component';
import { FavoritesService } from '../favs/favorites.service';
import { Reminder } from '../data/models';
import { CommonModule } from '@angular/common';
import { clone, delay, getDayName } from '../utils/utils';
import { ReminderComponent, ReminderResult } from './reminder.component';
import { UiService } from '../ui/ui.service';
import { addIcons } from 'ionicons';
import { add, calendar } from 'ionicons/icons';
import { SettingsService } from '../data/settings.service';
import { CardHeaderComponent } from '../card-header/card-header.component';

@Component({
  selector: 'app-reminders',
  templateUrl: './reminders.component.html',
  styleUrls: ['./reminders.component.scss'],
  imports: [
    CommonModule,
    FriendComponent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonFabButton,
    IonIcon,
    IonCardContent,
    IonList,
    IonText,
    IonItem,
    IonLabel,
    CardHeaderComponent
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemindersComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private fav = inject(FavoritesService);
  private settings = inject(SettingsService);
  private ui = inject(UiService);
  private toastController = inject(ToastController);
  public events: Reminder[] = [];
  public startEvent = input<string>('');
  public endEvent = input<string>('');
  public highlightedDates = input<any[]>([]);
  private editingReminder: Reminder | undefined;
  private _change = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ add, calendar });
  }

  ngOnInit() {
    this.update();
  }

  async addReminder(event?: Reminder) {
    const e: any = document.getElementById('my-outlet');
    const modal = await this.modalCtrl.create({
      component: ReminderComponent,
      presentingElement: e,
      componentProps: event
        ? {
          event: event,
          startEvent: this.startEvent(),
          endEvent: this.endEvent(),
          highlightedDates: this.highlightedDates(),
          isEdit: event,
          showAddress: this.settings.isBurningMan()
        }
        : {
          startEvent: this.startEvent(),
          endEvent: this.endEvent(),
          highlightedDates: this.highlightedDates(),
          isEdit: false,
          showAddress: this.settings.isBurningMan()
        },
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    delay(800); // Time for animation
    switch (role) {
      case ReminderResult.confirm: {
        if (event) {
          await this.fav.updatePrivateEvent(data, event);
        } else {
          const result = await this.fav.addPrivateEvent(data);
          if (result) {
            this.ui.presentToast(result, this.toastController);
          }
        }
        await this.update();
        return;
      }
      case ReminderResult.delete: {
        await this.fav.deletePrivateEvent(this.editingReminder!);
        await this.update();
        return;
      }
    }
  }

  async update() {
    const favs = await this.fav.getFavorites();
    for (let event of favs.privateEvents) {
      event.startDay = getDayName(event.start);

      event.startTime = new Date(event.start)
        .toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
        .toLowerCase();
    }

    this.events = favs.privateEvents;
    this._change.markForCheck();
  }

  async editReminder(event: Reminder) {
    this.editingReminder = clone(event);
    this.addReminder(event);
  }
}
