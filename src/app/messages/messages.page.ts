import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonText } from '@ionic/angular/standalone';
import { MessagesService } from '../message/messages.service';
import { MessageCardComponent } from './message-card.component';
import { EmailCardComponent } from './email-card.component';
import { SettingsService } from '../data/settings.service';
import { Email } from '../message/emails';
import { Item } from '../message/mastodon-feed';
import { delay } from '../utils/utils';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ IonText, IonButtons, IonBackButton, IonContent, IonHeader, IonTitle,
    MessageCardComponent, EmailCardComponent, 
    IonToolbar, CommonModule, FormsModule]
})
export class MessagesPage implements OnInit {

  private settings = inject(SettingsService);
  private messages = inject(MessagesService);
  feed = this.messages.feed;
  emails = this.messages.email;
  unread = computed(()=> {
    if (!this.feed().rss && this.emails().length == 0) {{
      return -1;
    }}
    const messages = this.feed().rss ? this.feed().rss.channel.item.filter(i => !i.read).length : 0;
    return this.emails().filter(i => !i.read).length + messages;
  });
  constructor() { }


  clear() {
    this.feed.set({} as any);
    this.emails.set([] as any);
  }

  async ngOnInit() {
    await this.messages.getMessages(
      this.settings.settings.datasetId,
      this.settings.settings.dataset?.mastodonHandle,
      this.settings.settings.dataset?.inboxEmail == 'Y');
  }

  async markAsRead(email: Email) {
    email.reading = true;
    await delay(500);
    await this.messages.markEmailAsRead(email);
    this.ngOnInit();
  }

  async markMessageAsRead(message: Item) {
    message.reading = true;
    await delay(500);
    await this.messages.markMessageAsRead(message);
    this.ngOnInit();
  }

}
