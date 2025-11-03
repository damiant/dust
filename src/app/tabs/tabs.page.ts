import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EnvironmentInjector, OnInit, effect, inject } from '@angular/core';
import { DbService } from '../data/db.service';
import { NotificationService } from '../notifications/notification.service';
import { Router } from '@angular/router';
import { daysUntil, delay, now } from '../utils/utils';
import { UiService } from '../ui/ui.service';
import { SettingsService } from '../data/settings.service';
import { ShareInfoType, ShareService } from '../share/share.service';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { environment } from 'src/environments/environment';
import { Keyboard } from '@capacitor/keyboard';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { musicalNotesOutline, ellipsisVertical, mailOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { FavoritesService } from '../favs/favorites.service';
import { TextZoom } from '@capacitor/text-zoom';
import { BurnPlannerService } from '../data/burn-planner.service';
import { GeoService } from '../geolocation/geo.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonBadge, CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage implements OnInit {
  public db = inject(DbService);
  private ui = inject(UiService);
  private _change = inject(ChangeDetectorRef);
  public favs = inject(FavoritesService);
  private notificationService = inject(NotificationService);
  private shareService = inject(ShareService);
  private settings = inject(SettingsService);
  private burnPlanner = inject(BurnPlannerService);
  private router = inject(Router);
  private geo = inject(GeoService);
  ready = false;
  currentTab: string | undefined;
  private activeTab?: HTMLElement;
  public environmentInjector = inject(EnvironmentInjector);
  constructor() {
    addIcons({ mailOutline, musicalNotesOutline, ellipsisVertical });
    effect(() => {
      const eventId = this.notificationService.hasNotification();
      if (eventId && eventId.length > 0) {
        console.log('go to notification');
        this.goToFavEvent(eventId);
      }
    });
    effect(async () => {
      const shareItem = this.shareService.hasShare();
      if (shareItem && shareItem.type !== ShareInfoType.none) {
        console.log(`Open shared item ${shareItem.type} ${shareItem.id}`);
        switch (shareItem.type) {
          case ShareInfoType.art:
            return await this.navTo('art', shareItem.id);
          case ShareInfoType.camp:
            return await this.navTo('camp', shareItem.id);
          case ShareInfoType.event:
            return await this.navTo('event', shareItem.id);
          case ShareInfoType.burnPlanner:
            return await this.burnPlanner.import(shareItem.id);
          default:
            console.error(`Unknown share type ${shareItem.type}`);
            return;
        }
      }
    });
  }

  async ngOnInit() {
    this.ready = true;

    // Whenever app is resumed set signal called resume
    App.addListener('resume', async () => {
      if (Capacitor.getPlatform() !== 'web') {
        const result = await TextZoom.getPreferred();
        this.ui.textZoom.set(result.value);
        document.documentElement.style.setProperty('--text-zoom', `${this.ui.textZoom()}`);
      }
      const until = await this.daysUntilStarts();
      console.log(`${until} days until event.`);
      let hide = until > 1;
      if (environment.overrideLocations) {
        hide = false;
      }
      const timeZone = this.db.getTimeZone();
      if (this.db.anyLocationsHidden() && !hide) {
        // Locations were unlocked
        this.db.setLocationHidden({ art: false, camps: false, artMessage: '', campMessage: '' });
        await this.db.populate(this.settings.settings.datasetId, timeZone);
      }
      this.ui.setStatusBarBasedOnTheme();
      this.geo.resetPosition();
      this.db.resume.set(new Date().toISOString());
    });

    // When app is paused hide the keyboard
    App.addListener('pause', async () => {
      if (Capacitor.getPlatform() !== 'web') {
        await Keyboard.hide();
      }
    });

    await Network.addListener('networkStatusChange', (status) => {
      this.db.networkStatus.set(status.connectionType);
    });
    const status = await Network.getStatus();
    this.db.networkStatus.set(status.connectionType);

    if (Capacitor.getPlatform() !== 'web') {
      await ScreenOrientation.lock({ orientation: 'portrait' });
    }
  }

  public async daysUntilStarts(): Promise<number> {
    const s = this.settings.settings.dataset?.start;
    const start = new Date(s!);
    const until = daysUntil(start, now());
    return until;
  }

  private async navTo(page: string, id: string) {
    while (!this.ready) {
      await delay(500);
    }
    setTimeout(() => {
      this.router.navigateByUrl(`/${page}/${id}`);
      this._change.markForCheck();
    }, 100);
  }

  async goToFavEvent(eventId: string) {
    while (!this.ready) {
      await delay(500);
    }
    document.getElementById('favButton')?.click();
    setTimeout(() => {
      this.router.navigateByUrl(`/event/${eventId}`);
      this._change.detectChanges();
    }, 1000);
  }

  async changeTab(tabsRef: IonTabs) {
    this.activeTab = tabsRef.outlet.activatedView?.element;
    this.currentTab = tabsRef.getSelected();
    if (Capacitor.isNativePlatform() && !this.ui.isAndroid()) {
      const isHidden = this.currentTab == 'profile';
      if (isHidden) {
        StatusBar.hide();
      } else {
        StatusBar.show();
      }
    }
  }

  ionViewWillLeave() {
    this.propagateToActiveTab('ionViewWillLeave');
  }

  ionViewDidLeave() {
    this.propagateToActiveTab('ionViewDidLeave');
  }

  ionViewWillEnter() {
    this.propagateToActiveTab('ionViewWillEnter');
  }

  ionViewDidEnter() {
    this.propagateToActiveTab('ionViewDidEnter');
  }

  private propagateToActiveTab(eventName: string) {
    if (this.activeTab) {
      this.activeTab.dispatchEvent(new CustomEvent(eventName));
    }
  }

  select(tab: string) {
    this._change.markForCheck();
    if (tab == this.currentTab) {
      this.ui.setTab(tab);
    }
  }
}
