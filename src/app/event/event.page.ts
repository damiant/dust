import { Component, OnInit, signal, input, viewChild, inject, OnDestroy, computed, effect, output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonRouterOutlet,
  IonText,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../data/db.service';
import { Event, MapPoint, OccurrenceSet } from '../data/models';
import { MapComponent } from '../map/map.component';
import { FavoritesService } from '../favs/favorites.service';
import { ShareInfoType } from '../share/share.service';
import { SettingsService } from '../data/settings.service';
import { UiService } from '../ui/ui.service';
import { toMapPoint } from '../map/map.utils';
import { dateMatches, noDate, sameDay } from '../utils/utils';
import { addIcons } from 'ionicons';
import {
  shareOutline,
  locationOutline,
  timeOutline,
  star,
  starOutline,
  pricetagOutline,
  closeCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { CachedImgComponent, ImageLocation } from '../cached-img/cached-img.component';
import { canCreate } from '../map/map';
import { ScrollResult } from '../map/map-model';
import { EventChanged, EventsService } from '../events/events.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-event',
    templateUrl: './event.page.html',
    styleUrls: ['./event.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        FormsModule,
        MapComponent,
        IonItem,
        IonButton,
        IonText,
        IonIcon,
        IonLabel,
        IonBadge,
        IonContent,
        IonList,
        IonButtons,
        IonToolbar,
        IonBackButton,
        IonHeader,
        IonPopover,
        CachedImgComponent,
    ]
})
export class EventPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private db = inject(DbService);
  private fav = inject(FavoritesService);
  private settings = inject(SettingsService);
  private ui = inject(UiService);
  private toastController = inject(ToastController);
  private eventsService = inject(EventsService);
  private _change = inject(ChangeDetectorRef);
  public event: Event | undefined;
  public back = signal('Back');
  public navButtons = computed(() => {
    return this.back() !== 'Search' && this.back() !== 'Now';
  });
  popover = viewChild.required<IonPopover>('popover');
  locationPopover = viewChild.required<IonPopover>('locationPopover');
  content = viewChild.required(IonContent);
  isOpen = false;
  isLocationInfoOpen = false;
  ready = false;
  showMap = false;
  mapPoints: MapPoint[] = [];
  mapTitle = '';
  mapSubtitle = '';
  campDescription = '';
  locationInfo = '';
  prevDisabled = false;
  nextDisabled = false;
  routerOutlet: IonRouterOutlet = inject(IonRouterOutlet);
  private eventChangeSubscription?: Subscription;
  private day: Date | undefined;
  eventId = input<string>();
  filterDays = input<boolean>(true); // Whether to filter by day
  imageLocation = input<ImageLocation>('top');
  opened = output<string>();
  constructor() {
    addIcons({ shareOutline, locationOutline, chevronForwardOutline, chevronBackOutline, timeOutline, star, starOutline, pricetagOutline, closeCircleOutline });
    effect(() => {
      const position = this.eventsService.position();
      this.prevDisabled = position == 'start';
      this.nextDisabled = position == 'end';
    });
  }

  async ngOnInit() {
    this.db.checkInit();

    this.ready = false;
    const eventId = this.eventId() ? this.eventId()! + '+' : this.route.snapshot.paramMap.get('id');
    this.init(eventId);
    this.showMap = canCreate();
    if (!this.showMap) {
      this.routerOutlet.swipeGesture = true;
    }
    this.eventChangeSubscription = this.eventsService.eventChanged.subscribe(async (eventChange: EventChanged) => {
      this.eventsService.currentEventId = eventChange.eventId;
      await this.init(eventChange.eventId);
    });
  }

  ngOnDestroy(): void {
    if (this.eventChangeSubscription) {
      this.eventChangeSubscription.unsubscribe();
    }
  }

  ionViewDidLeave() {
    this.eventsService.leftEventPage.emit();
  }


  private async init(eventId: string | null) {
    try {
      let tmp = eventId?.split('+');

      if (!tmp) throw new Error('Route error');
      const id = tmp[0];

      this.back.set(tmp[1]);
      this.event = await this.db.findEvent(id);
      this.mapTitle = this.event.camp;
      this.mapSubtitle = this.event.location;
      const mapPoint = toMapPoint(this.event.location, {
        title: this.event.title,
        location: this.event.location,
        subtitle: this.event.camp,
      });
      if (this.event.pin) {
        mapPoint.x = this.event.pin.x;
        mapPoint.y = this.event.pin.y;
      } else {
        mapPoint.gps = await this.db.getMapPointGPS(mapPoint);
      }
      this.mapPoints = [mapPoint];
      const selectedDay = this.db.selectedDay();
      const occurrences = JSON.parse(JSON.stringify(this.event.occurrence_set));
      const isNoDate = sameDay(selectedDay, noDate());
      this.event.occurrence_set = occurrences.filter((o: any) => {      
        const isSelectedDay = dateMatches(selectedDay, o);
        if (!isNoDate && !isSelectedDay) {
          if (this.filterDays()) {
            return false;
          }
        }
        return !o.old;
      });
      if (isNoDate) {
        if (occurrences.every((o: any) => o.old)) {
          this.event.occurrence_set = occurrences;
        }
      }   
      await this.fav.setEventStars(this.event);
    } finally {
      this.ready = true;
      this._change.markForCheck();
    }
  }

  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      color: 'primary',
      duration: 3500,
      swipeGesture: 'vertical',
      position: 'bottom',
    });

    await toast.present();
  }

  closePopover() {
    this.isOpen = false;
  }

  closeLocationInfoPopover() {
    this.isLocationInfoOpen = false;
  }

  async showCamp(e: any) {
    this.popover().event = e;
    const camp = await this.db.findCamp(this.event?.hosted_by_camp!);
    if (camp) {
      this.campDescription = camp.description!;
      this.isOpen = true;
    }
    this._change.detectChanges();
  }

  async showLocationInfo(e: any) {
    this.locationPopover().event = e;
    if (this.db.locationsHidden().camps) {
      this.locationInfo = `Locations cannot be display yet. ${this.db.locationsHidden().campMessage}.`;
      this.isLocationInfoOpen = true;
      this._change.detectChanges();
      return;
    }
    const camp = await this.db.findCamp(this.event?.hosted_by_camp!);
    if (camp && camp.landmark) {
      this.locationInfo = `${camp.landmark}. (${camp.facing})`;
      this.isLocationInfoOpen = true;
      this._change.detectChanges();
    }
  }

  scrolled(result: ScrollResult) {
    if (this.ui.swipedDown(result)) {
      this.content().scrollToTop(500);
    }
  }

  noop() { }

  next() {
    this.eventsService.next.emit(`${this.event?.uid}`);
  }

  prev() {
    this.eventsService.prev.emit(`${this.event?.uid}`);
  }

  share() {
    const url = `https://dust.events?${ShareInfoType.event}=${this.event?.uid}`;
    this.ui.share({
      title: this.event?.title,
      dialogTitle: this.event?.title,
      text: `Check out ${this.event?.title} at ${this.event?.camp} (${this.event?.location
        }) ${this.settings.eventTitle()} using the dust app. `,
      url,
    });
  }

  async toggleStar(occurrence: OccurrenceSet) {
    if (!this.event) return;
    occurrence.star = !occurrence.star;
    const message = await this.fav.starEvent(occurrence.star, this.event, this.db.selectedDay(), occurrence);
    if (message) {
      this.presentToast(message);
    }
  }
}
