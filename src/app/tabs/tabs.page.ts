import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, OnInit, effect, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DbService } from '../db.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { NotificationService } from '../notification.service';
import { Router } from '@angular/router';
import { delay } from '../utils';
import { UiService } from '../ui.service';
import { FavoritesService } from '../favorites.service';
import { SettingsService } from '../settings.service';
@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class TabsPage implements OnInit {
  ready = false;
  currentTab = '';
  public environmentInjector = inject(EnvironmentInjector);
  constructor(
    private db: DbService, private ui: UiService,
    private notificationService: NotificationService,
    private router: Router, private settingsService: SettingsService) {
    effect(() => {
      const eventId = this.notificationService.hasNotification();
      if (eventId && eventId.length > 0) {
        console.log('go to notification');
        this.goToFavEvent(eventId);
      }
    });
  }

  async ngOnInit() {
    await this.db.init(this.settingsService.settings.dataset);
    this.ready = true;
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

  changeTab(e: any) {
    this.currentTab = e.tab;
  }

  select(tab: string) {
    if (tab == this.currentTab) {
      this.ui.setTab(tab);
    }

  }
}
