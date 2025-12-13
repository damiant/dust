import { ChangeDetectionStrategy, Component, input, output, inject, computed, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Event } from '../data/models';

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
import { mapOutline, starOutline, star, repeatOutline } from 'ionicons/icons';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { FavoritesService } from '../favs/favorites.service';
import { DbService } from '../data/db.service';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
],
})
export class EventComponent {
  private router = inject(Router);
  private fav = inject(FavoritesService);
  private db = inject(DbService);
  private _change = inject(ChangeDetectorRef);
  private emitting = 0;
  public class = computed(() => {
    const highlight = this.highlighted() ? 'highlight' : '';
    if (this.variableHeight()) {
      return highlight;
    } else return `${highlight} item`;
  });

  event = input.required<Event>();
  highlighted = input(false);
  location = computed(() => {
    return this.event().location ? ` (${this.event().location})` : '';
  });
  title = input('Events');
  titleEncoded = computed(() => {
    return encodeURIComponent(this.title());
  });
  day = input<Date>();
  showImage = input(true);
  longTime = input(false);
  variableHeight = input(false);
  mapClick = output<any>();
  starClick = output<boolean>();
  groupClick = output<Event>();
  rslClick = output<string>();
  opened = output<string>();
  isReady = false;

  constructor() {
    addIcons({ mapOutline, star, starOutline, repeatOutline });
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

  emitStar(star: boolean) {
    this.emitting = 3;
    this.starClick.emit(star);
  }

  detail() {
    this.emitting = this.emitting - 1;
    if (this.emitting > 0) {
      return;
    }
    if (this.event().slug?.startsWith('rsl')) {
      return;
    }
    if (this.event().uid === '') {
      this.rslClick.emit(this.event().slug);
      return;
    }
    this.opened.emit(this.event().uid);
    this.router.navigateByUrl('/event/' + this.event().uid + '+' + this.titleEncoded());
  }
}
