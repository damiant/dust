import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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
    CachedImgComponent,
  ],
})
export class EventComponent {
  event = input.required<Event>();
  title = input('Events');
  day = input<Date>();
  showImage = input(true);
  longTime = input(false);
  variableHeight = input(false);
  mapClick = output<any>();
  groupClick = output<Event>();
  rslClick = output<string>();
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
    return this.day();
  }

  detail() {
    if (this.event().uid === '') {
      this.rslClick.emit(this.event().slug);
      return;
    }
    this.router.navigateByUrl('/event/' + this.event().uid + '+' + this.title());
  }
}
