import { Component, OnInit, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonicModule, ToastController } from '@ionic/angular';
import { UiService } from '../ui/ui.service';
import { DbService } from '../data/db.service';
import { noDate, now, sameDay } from '../utils/utils';
import { Day, MapPoint, RSLEvent } from '../data/models';
import { GpsCoord } from '../map/geo.utils';
import { GeoService } from '../geolocation/geo.service';
import { SearchComponent } from '../search/search.component';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { SkeletonEventComponent } from '../skeleton-event/skeleton-event.component';
import { RslEventComponent } from '../rsl-event/rsl-event.component';
import { toMapPoint } from '../map/map.utils';

interface RSLState {
  byDist: boolean,
  days: Day[],
  events: RSLEvent[],
  search: string,
  mapTitle: string,
  mapSubtitle: string,
  title: string,
  defaultDay: any,
  showMap: boolean,
  noEvents: boolean,
  noEventsMessage: string,
  mapPoints: MapPoint[],
  day: Date,
  displayedDistMessage: boolean
}

function initialState(): RSLState {
  return {
    byDist: false,
    days: [],
    events: [],
    search: '',
    title: 'Rock Star Librarian',
    mapTitle: '',
    mapSubtitle: '',
    mapPoints: [],
    showMap: false,
    noEvents: false,
    noEventsMessage: '',
    day: noDate(),
    defaultDay: 'all',
    displayedDistMessage: false
  }
}
@Component({
  selector: 'app-rsl',
  templateUrl: './rsl.page.html',
  styleUrls: ['./rsl.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule,
    RslEventComponent,
    SearchComponent, MapModalComponent, SkeletonEventComponent]
})
export class RslPage implements OnInit {

  vm: RSLState = initialState();
  @ViewChild(IonContent) ionContent!: IonContent;
  constructor(
    private ui: UiService,
    private db: DbService,
    private geo: GeoService,
    private toastController: ToastController) {
    effect(() => {
      this.ui.scrollUpContent('rsl', this.ionContent);
    });
    effect(() => {
      const year = this.db.selectedYear();
      console.log(`RSLPage.yearChange ${year}`);
      this.db.checkInit();
      this.vm = initialState();
      this.init();
    });
    effect(async () => {
      const resumed = this.db.resume();
      if (resumed.length > 0) {
        await this.update();
      }
    })
  }

  private async init() {
    const today = now();
    this.setToday(today);

    this.vm.days = await this.db.getDays();
    this.vm.defaultDay = this.chooseDefaultDay(now());
    await this.update();
  }

  private async update(scrollToTop?: boolean) {
    let coords: GpsCoord | undefined = undefined;
    if (this.vm.byDist) {
      coords = await this.geo.getPosition();
    }
    this.vm.events = await this.db.getRSL(this.vm.search, this.vm.day, coords);
    this.vm.noEvents = this.vm.events.length == 0;
    this.vm.noEventsMessage = this.vm.search?.length > 0 ?
      `There are no events matching "${this.vm.search}".` :
      'All the events for this day have concluded.';
    if (scrollToTop) {
      this.ui.scrollUpContent('rsl', this.ionContent);
    }
  }


  public map(event: RSLEvent) {
    this.vm.mapPoints = [toMapPoint(event.location)];
    this.vm.mapTitle = event.camp;
    this.vm.mapSubtitle = event.location;
    this.vm.showMap = true;
  }

  public async dayChange(event: any) {
    this.vm.day = new Date(event.target.value);
    console.log(`Day Change ${this.vm.day}`);

    this.updateTitle();
    await this.update(true);
  }

  private updateTitle() {
    const day = this.vm.day;
    this.vm.title = (!sameDay(day, noDate())) ? day.toLocaleDateString('en-US', { weekday: 'long' }) : 'Rock Star Librarian';
  }

  private setToday(today: Date) {
    for (const day of this.vm.days) {
      day.today = sameDay(day.date, today);
    }
  }

  public eventsTrackBy(index: number, event: RSLEvent) {
    return event.id;
  }

  public searchEvents(value: string) {
    this.vm.search = value.toLowerCase();
    this.update(true);
  }

  private chooseDefaultDay(today: Date): Date | string {
    for (const day of this.vm.days) {
      if (day.date && sameDay(day.date, today)) {
        this.vm.day = day.date;
        return day.date;
      }
    }
    this.vm.day = this.vm.days[0].date;
    return this.vm.days[0].date;
  }

  ngOnInit() {
  }

  toggleByDist() {
    this.vm.byDist = !this.vm.byDist;
    if (this.vm.byDist && !this.vm.displayedDistMessage) {
      this.ui.presentToast(`Displaying events sorted by distance`, this.toastController);
      this.vm.displayedDistMessage = true;
    }
    this.update(true);
  }

}
