import { Component, EnvironmentInjector, NgZone, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from './notifications/notification.service';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { ShareInfoType, ShareService } from './share/share.service';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { RouterFocusService } from './utils/focus.service';
import { IntegrityService } from './data/integrity.service';
import { DbService } from './data/db.service';
import { ApiService } from './data/api.service';
import { UiService } from './ui/ui.service';
import { SettingsService } from './data/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, CommonModule],
})
export class AppComponent implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);

  constructor(
    private notificationService: NotificationService,
    private integrityService: IntegrityService,
    private api: ApiService,
    private shareService: ShareService,
    private zone: NgZone,
    private focusService: RouterFocusService,
    private dbService: DbService,
    private ui: UiService,
    private settings: SettingsService
  ) {
    effect(() => {
      const restart = this.dbService.restart();
      if (restart == '') return;
      this.settings.settings.preventAutoStart = true;
      this.ui.home();
    });
  }

  async ngOnInit() {
    await this.notificationService.configure();
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.zone.run(() => {
        try {
          // url will come in like https://dust.events?art=1234
          const tmp = event.url.split('?');
          if (tmp.length > 1) {
            const kv = tmp[1].split('=');
            this.shareService.notify(kv[0] as ShareInfoType, kv[1]);
          }
        } catch (e) {
          console.error('appUrlOpen', e);
        }
      });
    });    

    // Test application integrity
    setTimeout(() => {      
      this.integrityService.testIntegrity();
    }, 10000);
  }

  stackChanged() {    
    this.dbService.getWorkerLogs();
    this.focusService.focus();
  }
}
