import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, OnInit, effect, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DbService } from '../data/db.service';
import { NotificationService } from '../notifications/notification.service';
import { Router } from '@angular/router';
import { delay } from '../utils/utils';
import { UiService } from '../ui/ui.service';
import { SettingsService } from '../data/settings.service';
import { ShareInfoType, ShareService } from '../share/share.service';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';

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
    public db: DbService, private ui: UiService,
    private notificationService: NotificationService,
    private shareService: ShareService,
    private router: Router, private settingsService: SettingsService) {
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
          case ShareInfoType.art: return await this.navTo('art', shareItem.id);
          case ShareInfoType.camp: return await this.navTo('camp', shareItem.id);
          case ShareInfoType.event: return await this.navTo('event', shareItem.id);
        }
      }
    })
  }

  async ngOnInit() {    
    this.ready = true;
    
    // Whenever app is resumed set signal called resume
    App.addListener('resume', async () => {
      this.db.resume.set(new Date().toISOString());
    });

    Network.addListener('networkStatusChange', status => {
      this.db.networkStatus.set(status.connectionType);
    });
    const status = await Network.getStatus();
    this.db.networkStatus.set(status.connectionType);
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

  changeTab(e: any) {
    this.currentTab = e.tab;
  }

  select(tab: string) {
    if (tab == this.currentTab) {
      this.ui.setTab(tab);
    }

  }
}
