import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonSpinner, IonList, IonIcon, IonItem, IonLabel, IonText } from '@ionic/angular/standalone';
import { MessagesService } from '../message/messages.service';
import { MastodonFeed } from '../message/mastodon-feed';
import { MessageCardComponent } from './message-card.component';
import { SettingsService } from '../data/settings.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  standalone: true,
  imports: [IonText, IonLabel, IonItem, IonIcon, IonList, IonSpinner, IonButtons, IonBackButton, IonContent, IonHeader, IonTitle, 
    MessageCardComponent,
    IonToolbar, CommonModule, FormsModule]
})
export class MessagesPage implements OnInit {
  
  private settings = inject(SettingsService);
  private messages = inject(MessagesService);
  feed = this.messages.feed;
  constructor() { }

  ionViewDidEnter() {

  }
  async ngOnInit() {
    await this.messages.getMessages(this.settings.settings.datasetId, this.settings.settings.dataset?.mastodonHandle);    
  }

}
