import { ChangeDetectionStrategy, Component, input, output, inject, effect, computed } from '@angular/core';
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
import { mapOutline, starOutline, star } from 'ionicons/icons';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { FavoritesService } from '../favs/favorites.service';
import { DbService } from '../data/db.service';

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
  private router = inject(Router);
  private fav = inject(FavoritesService);
  private db = inject(DbService);
  private emitting = 0;
  public class = computed(() => {
    if (this.variableHeight()) {
      return '';
    } else return 'item';
  });

  event = input.required<Event>();
  location = computed(() => {
    return this.event().location ? ` (${this.event().location})` : '';
  });
  title = input('Events');
  titleEncoded = computed(() => {
    return encodeURIComponent(this.title());
  });
  day = input<Date>();
  showStar = true;
  showImage = input(true);
  longTime = input(false);
  variableHeight = input(false);
  star = false;
  mapClick = output<any>();
  starClick = output<boolean>();
  groupClick = output<Event>();
  rslClick = output<string>();
  longEvent = output<number>();
  opened = output<string>();
  isReady = false;

  constructor() {
    addIcons({ mapOutline, starOutline, star });
    effect(async () => {
      const e = this.event();
      this.checkStarred(e);
    });
  }

  private async checkStarred(e: Event) {
    await this.fav.setEventStars(e);
    const occurrence = this.fav.selectOccurrence(e, this.db.selectedDay());
    this.showStar = !!occurrence;
    const starred = occurrence ? await this.fav.isFavEventOccurrence(e.uid, occurrence) : false;
    this.star = starred;
    if (occurrence) {
      const length = this.hoursBetween(new Date(occurrence.end_time), new Date(occurrence.start_time));
      if (length > 5) {
        this.longEvent.emit(length);
      }
    }
  }

  private hoursBetween(d1: any, d2: any): number {
    return Math.ceil(Math.abs(d1 - d2) / 36e5);
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
    this.checkStarred(this.event());
  }

  detail() {
    this.emitting = this.emitting - 1;
    if (this.emitting > 0) {
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
