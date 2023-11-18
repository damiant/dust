import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Event } from '../data/models';
import { CommonModule } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonIcon,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline } from 'ionicons/icons';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardContent,
    IonText,
  ],
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('0.3s ease-in-out')),
    ]),
  ],
})
export class EventComponent {
  @Input() event!: Event;
  @Input() title = 'Events';
  @Input() day: Date | undefined;
  @Input() showImage = true;
  @Input() longTime = false;
  @Output() mapClick = new EventEmitter<any>();
  @Output() groupClick = new EventEmitter<Event>();
  @Output() rslClick = new EventEmitter<string>();
  isReady = false;

  constructor(private router: Router) {
    addIcons({ mapOutline });
  }

  ready() {
    this.isReady = true;
  }

  map(event: Event) {
    this.mapClick.emit(event);
  }

  group(event: Event) {
    this.groupClick.emit(event);
  }

  getDay() {
    return this.day;
  }

  detail() {
    if (this.event.uid === '') {
      this.rslClick.emit(this.event.slug);
      return;
    }
    this.router.navigateByUrl('/event/' + this.event.uid + '+' + this.title);
  }
}
