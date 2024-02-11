import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Event } from '../data/models';
import { CommonModule } from '@angular/common';
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
import { CachedImgComponent } from '../cached-img/cached-img.component';

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
    CachedImgComponent
  ]
})
export class EventComponent {
  @Input() event!: Event;
  @Input() title = 'Events';
  @Input() day: Date | undefined;
  @Input() showImage = true;
  @Input() longTime = false;
  @Input() variableHeight = false;
  @Output() mapClick = new EventEmitter<any>();
  @Output() groupClick = new EventEmitter<Event>();
  @Output() rslClick = new EventEmitter<string>();
  isReady = false;

  constructor(private router: Router) {
    addIcons({ mapOutline });
  }

  map(event: Event, ev: any) {
    this.mapClick.emit(event);
    ev.stopPropagation();
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
