import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonText } from '@ionic/angular/standalone';
import { MessagesService } from '../message/messages.service';
import { MessageCardComponent } from './message-card.component';
import { EmailCardComponent } from './email-card.component';
import { SettingsService } from '../data/settings.service';
import { Email } from '../message/emails';
import { Item } from '../message/rss-feed';
import { delay } from '../utils/utils';
import { DbService } from '../data/db.service';
import { UiService } from '../ui/ui.service';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.page.html',
    styleUrls: ['./messages.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonText, IonButtons, IonBackButton, IonContent, IonHeader, IonTitle,
        MessageCardComponent, EmailCardComponent,
        IonToolbar, CommonModule, FormsModule]
})
export class MessagesPage implements OnInit {

  private settings = inject(SettingsService);
  private messages = inject(MessagesService);
  private ui = inject(UiService);
  public db = inject(DbService);
  feed = this.messages.feed;
  emails = this.messages.email;
  ionContent = viewChild.required(IonContent);
  unread = computed(()=> {
    if (!this.feed().rss && this.emails().length == 0) {{
      return -1;
    }}
    const messages = this.feed().rss ? this.feed().rss.channel.item.filter(i => !i.read).length : 0;
    return this.emails().filter(i => !i.read).length + messages;
  });
  constructor() {
    effect(() => {
      this.ui.scrollUpContent('messages', this.ionContent());
    });

    effect(async () => {
      const resumed = this.db.resume();
      if (resumed.length > 0) {
        await this.update();
      }
    });
   }


  clear() {
    this.feed.set({} as any);
    this.emails.set([] as any);
  }

  async ngOnInit() {
    this.update(); 
  }

  private async update() {
    
    await this.messages.getMessages(
      this.settings.settings.datasetId,
      this.settings.settings.dataset?.rssFeed,
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
