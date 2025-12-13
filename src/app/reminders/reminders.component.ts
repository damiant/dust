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

import { clone, delay, getDayName, isWhiteSpace } from '../utils/utils';
import { ReminderComponent, ReminderResult } from './reminder.component';
import { UiService } from '../ui/ui.service';
import { addIcons } from 'ionicons';
import { add, calendar } from 'ionicons/icons';
import { SettingsService } from '../data/settings.service';
import { CardHeaderComponent } from '../card-header/card-header.component';
import { Shift, VolunteeripateService } from '../volunteeripate/volunteeripate.service';
import { ShareInfoType, ShareService } from '../share/share.service';
import { DbService } from '../data/db.service';
import { getTimeInTimeZone } from '../utils/date-utils';

@Component({
  selector: 'app-reminders',
  templateUrl: './reminders.component.html',
  styleUrls: ['./reminders.component.scss'],
  imports: [IonCard, IonIcon, IonCardContent, IonList, IonText, IonItem, IonLabel, CardHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  public db = inject(DbService);
  public startEvent = input<string>('');
  public endEvent = input<string>('');
  public highlightedDates = input<any[]>([]);
  private editingReminder: Reminder | undefined;
  private _change = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ add, calendar });
    effect(async () => {
      const shareItem = this.shareService.hasShare();
      if (shareItem && shareItem.type == ShareInfoType.token) {
        console.log(`Share found ${shareItem.id} ${shareItem.path}`);
        const subdomain = this.settings.settings.dataset?.volunteeripateSubdomain ?? '';
        if (!isWhiteSpace(subdomain)) {
          this.applyReminders(await this.volunteeripate.getShifts(subdomain, shareItem.id));
        }
      }
    });
  }

  ngOnInit() {
    this.update();
  }

  private async applyReminders(shifts: Shift[]) {
    let id = 1000;
    const favs = await this.fav.getFavorites();
    for (let event of favs.privateEvents) {
      if (parseInt(event.id) > id) {
        await this.fav.deletePrivateEvent(event);
      }
    }
    const titles: string[] = [];
    let count = 0;
    const timeZone = this.db.getTimeZone();
    for (const shift of shifts) {
      id++;
      const start = getTimeInTimeZone(shift.shift_start * 1000, timeZone);
      const end = getTimeInTimeZone(shift.shift_end * 1000, timeZone);
      const timeRange =
        start != end ? `${this.timeString(start)} to ${this.timeString(end)}` : `${this.timeString(start)}`;
      let title = shift.shift_title;
      let n = 2;
      while (titles.includes(title)) {
        title = `${shift.shift_title} ${n}`;
        n++;
      }
      titles.push(title);
      const reminder: Reminder = {
        title,
        notes: `${timeRange}. ${shift.department_title}. ${shift.shift_description}`,
        address: shift.department_title,
        start, // 2025-04-30T07:00:00
        id: `${id}`,
      };
      await this.fav.addReminder(reminder);
      count++;
    }
    this.update();
    this.ui.presentDarkToast(`${count} reminders added for shifts.`, this.toastController);
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
            showAddress: this.settings.isBurningMan(),
          }
        : {
            startEvent: this.startEvent(),
            endEvent: this.endEvent(),
            highlightedDates: this.highlightedDates(),
            isEdit: false,
            showAddress: this.settings.isBurningMan(),
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
          console.log(data);
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
      event.startTime = this.timeString(event.start);
    }

    this.events = favs.privateEvents;
    this._change.markForCheck();
  }

  timeString(time: string): string {
    return new Date(time)
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .toLowerCase();
  }

  openVolunteeripate(): void {
    this.volunteeripate.signIn(this.settings.settings.dataset?.volunteeripateSubdomain ?? '');
  }

  async editReminder(event: Reminder) {
    this.editingReminder = clone(event);
    this.addReminder(event);
  }
}
