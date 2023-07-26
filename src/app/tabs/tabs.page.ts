import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, OnInit, ViewChild, effect, inject } from '@angular/core';
import { IonTabs, IonicModule } from '@ionic/angular';
import { DbService } from '../db.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { NotificationService } from '../notification.service';
import { Router } from '@angular/router';
import { delay } from '../utils';
@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class TabsPage implements OnInit {
  ready = false;
  public environmentInjector = inject(EnvironmentInjector);
  constructor(private db: DbService, private notificationService: NotificationService, private router: Router) {
    effect(() => {
      console.log('go to notification');
      const eventId = this.notificationService.hasNotification();
      if (eventId && eventId.length > 0) {
        this.goToFavEvent(eventId);
      }
    });
  }

  async ngOnInit() {
    await this.db.init();
    this.ready = true;
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 1000);
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
}
