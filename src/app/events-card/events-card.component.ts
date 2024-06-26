import { Component, computed, input } from '@angular/core';
import { IonCard, IonCardHeader, IonItem, IonList, IonCardContent, IonCardTitle, IonCardSubtitle } from "@ionic/angular/standalone";
import { Event } from '../data/models';
import { RouterModule } from '@angular/router';

interface Item {
  lines: string;
  time: string;
}

@Component({
  selector: 'app-events-card',
  templateUrl: './events-card.component.html',
  styleUrls: ['./events-card.component.scss'],
  standalone: true,
  imports: [IonCardSubtitle, IonCardTitle, IonCardContent, IonList, IonItem, IonCardHeader, IonCard, RouterModule]
})
export class EventsCardComponent {

  items = computed(() => {
    const events = this.events();

    const items: Item[] = [];
    let lastTime = '';
    for (let event of events) {
      if (event.timeString != lastTime) {
        if (items.length > 0) {
          items[items.length - 1].lines = 'inset';
        }
      }

      items.push({
        lines: 'none',
        time: (event.timeString == lastTime) ? '' : event.timeString
      });

      lastTime = event.timeString;
    }
    return items;
  });
  events = input<Event[]>([]);

  constructor() {


  }


}
