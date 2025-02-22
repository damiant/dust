import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, effect, inject, input } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
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
import { VolunteeripateService } from '../volunteeripate/volunteeripate.service';
import { ShareInfoType, ShareService } from '../share/share.service';

@Component({
  selector: 'app-reminders',
  templateUrl: './reminders.component.html',
  styleUrls: ['./reminders.component.scss'],
  imports: [
    CommonModule,
    IonCard,
    IonIcon,
    IonCardContent,
    IonList,
    IonText,
    IonItem,
    IonLabel,
    CardHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RemindersComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private fav = inject(FavoritesService);
  private settings = inject(SettingsService);
  private shareService = inject(ShareService);
  private volunteeripate = inject(VolunteeripateService);
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
    effect(async () => {
      const shareItem = this.shareService.hasShare();
      if (shareItem && shareItem.type == ShareInfoType.volunteeripate) {        
        this.applyReminders(await this.volunteeripate.getShifts(shareItem.volunteeripateToken!));

      }
    });
  }

  ngOnInit() {
    this.update();
  }

  private async applyReminders(reminders: any) {
    console.log('TODO: Create reminders from volunteeripate shifts', reminders);
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
          const result = await this.fav.addReminder(data);
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

  openVolunteeripate(): void {
    this.volunteeripate.signIn();
  }

  async editReminder(event: Reminder) {
    this.editingReminder = clone(event);
    this.addReminder(event);
  }
}
