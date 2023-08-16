import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LocalNotificationDescriptor, LocalNotifications } from '@capacitor/local-notifications';
import { OccurrenceSet } from '../data/models';
import { getDayName, noDate, now, randomInt, time } from '../utils/utils';

export interface Reminder {
  title: string,
  body: string,
  id: string,
  when?: Date,
  comment: string
}

export interface ScheduleResult {
  notifications: number,
  error?: string,
  message?: string
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public hasNotification = signal('');
  constructor(public router: Router) {

  }

  public async configure() {
    LocalNotifications.addListener('localNotificationActionPerformed', (notification => {
      this.hasNotification.set(notification.notification.extra.eventId);
    }));
  }

  public async scheduleAll(reminder: Reminder, occurrence_set: OccurrenceSet[], selectedDay?: Date): Promise<ScheduleResult> {
    const error = await this.verifyPermissions();
    if (error) {
      return { notifications: 0, error };
    }
    let count = 0;
    let last;
    let message = '';
    for (let occurrence of occurrence_set) {
      try {
        let isValid = true;
        if (!this.sameDate(selectedDay, noDate())) {
           // User has selected a particular day
           isValid = true;// dateMatches(selectedDay, occurrence);
        }
        console.log(`for this day=${isValid} selected=${selectedDay} start=${occurrence.start_time} end=${occurrence.end_time}`);
        if (isValid) {
          const start = new Date(occurrence.start_time);
          reminder.when = this.reminderTime(start);
          if (!this.sameDate(last, reminder.when)) {
            await this.schedule(reminder);
            message = `You'll be notified ${reminder.comment} on ${getDayName(reminder.when.toString())} at ${time(reminder.when)}`;
            count++;
          }
          last = reminder.when;
        }
      } catch {
        // This can occur if the time is in the past
        console.error(`Unable to schedule reminder`, reminder);
      }
    }
    return { notifications: count, message };
  }

  public async unscheduleAll(eventId: string) {
    const pending = await LocalNotifications.getPending();
    const list: LocalNotificationDescriptor[] = [];
    for (let notification of pending.notifications) {
      if (notification.extra && notification.extra.eventId == eventId) {
        list.push({ id: notification.id });
      }
    }
    if (list.length > 0) {
      LocalNotifications.cancel({ notifications: list });
    }
  }

  private sameDate(d1?: Date, d2?: Date): boolean {
    if (!d1 || !d2) return false;
    return d1.toString() == d2.toString();
  }

  private reminderTime(d: Date): Date {
    let when = d;
    when.setMinutes(when.getMinutes() - 5);
    if (this.hasHappened(when)) {
      const soon = now();
      soon.setMinutes(soon.getMinutes() + 1);
      soon.setSeconds(0);
      when = soon; // If it has already passed then remind in a minute
      console.log(`Event has happened already so setting for ${soon}`);
    }
    return when;
  }

  private async verifyPermissions(): Promise<string | undefined> {
    let status = await LocalNotifications.checkPermissions();
    if (status.display == 'granted') {
      return undefined;
    }
    status = await LocalNotifications.requestPermissions();
    if (status.display !== 'granted') {
      return `Unable to schedule notifications due to permissions error: ${status.display}`;
    }
    return undefined;
  }

  private hasHappened(d: Date) {
    const today = now();
    return (d.getTime() - today.getTime() < 0);
  }

  private async schedule(reminder: Reminder) {
    if (!reminder.when) {
      console.error('schedule reminder error', reminder);
      return;
    }

    // Schedule reminder
    await LocalNotifications.schedule({
      notifications: [
        {
          id: randomInt(1, 1000000),
          title: reminder.title,
          body: reminder.body,          
          schedule: { at: reminder.when, allowWhileIdle: true },
          extra: {
            eventId: reminder.id // Assume it is an event
          }
        }
      ]
    });
  }
}