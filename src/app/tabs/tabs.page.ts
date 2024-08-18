import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, OnInit, effect, inject } from '@angular/core';
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
import { musicalNotesOutline, ellipsisVertical } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Animation, StatusBar } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { FavoritesService } from '../favs/favorites.service';
import { TextZoom } from '@capacitor/text-zoom';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonBadge, CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage implements OnInit {
  public db = inject(DbService);
  private ui = inject(UiService);
  public favs = inject(FavoritesService);
  private notificationService = inject(NotificationService);
  private shareService = inject(ShareService);
  private settings = inject(SettingsService);
  private router = inject(Router);
  ready = false;
  currentTab: string | undefined;
  private activeTab?: HTMLElement;
  public environmentInjector = inject(EnvironmentInjector);
  constructor() {
    addIcons({ musicalNotesOutline, ellipsisVertical });
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
        }
      }
    });
  }

  async ngOnInit() {
    this.ready = true;

    // Whenever app is resumed set signal called resume
    App.addListener('resume', async () => {
      const result = await TextZoom.getPreferred();
      this.ui.textZoom.set(result.value);
      document.documentElement.style.setProperty("--text-zoom", `${this.ui.textZoom()}`);
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
    }, 100);
  }

  async goToFavEvent(eventId: string) {
    while (!this.ready) {
      await delay(500);
    }
    document.getElementById('favButton')?.click();
    setTimeout(() => {
      this.router.navigateByUrl(`/event/${eventId}`);
    }, 1000);
  }

  async changeTab(tabsRef: IonTabs) {
    this.activeTab = tabsRef.outlet.activatedView?.element;
    this.currentTab = tabsRef.getSelected();
    if (Capacitor.isNativePlatform() && !this.ui.isAndroid()) {
      const isHidden = this.currentTab == 'profile';
      if (isHidden) {
        StatusBar.hide({ animation: Animation.Fade });
      } else {
        StatusBar.show({ animation: Animation.Fade });
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
    if (tab == this.currentTab) {
      this.ui.setTab(tab);
    }
  }
}
