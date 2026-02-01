import { Component, computed, input } from '@angular/core';
import { IonCard, IonCardHeader, IonItem, IonCardTitle } from '@ionic/angular/standalone';
import { Event } from '../data/models';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Item {
  lines: string;
  time: string;
  class: string;
}

@Component({
  selector: 'app-events-card',
  templateUrl: './events-card.component.html',
  styleUrls: ['./events-card.component.scss'],
  imports: [IonCardTitle, IonItem, CommonModule, IonCardHeader, IonCard, RouterModule],
})
export class EventsCardComponent {
  items = computed(() => {
    const events = this.events();

    const items: Item[] = [];
    let lastTime = '';
    for (const event of events) {
      if (event.timeString != lastTime) {
        if (items.length > 0) {
          items[items.length - 1].lines = 'inset';
        }
      }

      items.push({
        lines: 'none',
        class: event.happening ? 'now' : event.old ? 'old' : '',
        time: event.timeString == lastTime ? '' : event.timeString,
      });

      lastTime = event.timeString;
    }
    return items;
  });
  events = input<Event[]>([]);

  constructor() {}
}
