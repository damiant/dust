import { ChangeDetectionStrategy, Component, EnvironmentInjector, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from './notifications/notification.service';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { ShareInfoType, ShareService } from './share/share.service';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { IntegrityService } from './data/integrity.service';
import { DbService } from './data/db.service';
import { UiService } from './ui/ui.service';
import { SettingsService } from './data/settings.service';
import { SafeArea, SafeAreaInsets } from 'capacitor-plugin-safe-area';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonApp, IonRouterOutlet, CommonModule]
})
export class AppComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private integrityService = inject(IntegrityService);
  private shareService = inject(ShareService);
  private dbService = inject(DbService);
  private ui = inject(UiService);
  private settings = inject(SettingsService);
  public environmentInjector = inject(EnvironmentInjector);

  constructor() {
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
      console.log('appUrlOpen', event);

      try {
        // url will come in like https://dust.events?art=1234
        const tmp = event.url.split('?');
        if (tmp.length > 1) {
          const kv = tmp[1].split('=');
          const u = new URL(event.url);
          const path = u.pathname;
          this.shareService.notify(kv[0] as ShareInfoType, kv[1], path);          
        }
      } catch (e) {
        console.error('appUrlOpen', e);
      }

    });

    SafeArea.getSafeAreaInsets().then((data) => {
      this.applyInsets(data);
    });
    await SafeArea.addListener('safeAreaChanged', data => {
      this.applyInsets(data);
    });

    // Test application integrity
    // setTimeout(() => {
    //   this.integrityService.testIntegrity();
    // }, 10000);
  }

  private applyInsets(data: SafeAreaInsets) {      
      const { insets } = data;
      console.log('SafeAreaInsets', insets);
      for (const [key, value] of Object.entries(insets)) {
        document.documentElement.style.setProperty(
          `--safe-area-inset-${key}`,
          `${value}px`,
        );
      }
  }

  stackChanged() {
    this.dbService.getWorkerLogs();
  }
}
