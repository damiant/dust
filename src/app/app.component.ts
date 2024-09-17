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
import { SiriShortcuts } from 'capacitor-plugin-siri-shorts';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonApp, IonRouterOutlet, CommonModule],
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
          this.shareService.notify(kv[0] as ShareInfoType, kv[1]);
        }
      } catch (e) {
        console.error('appUrlOpen', e);
      }

    });

    SiriShortcuts.addListener('appLaunchBySiriShortcuts', (res) => {
      // do something with the response of the shortcut here
      console.log('siri', res)
    });

    SiriShortcuts.donate({
      persistentIdentifier: "dustWhereAmI",
      title: "Where Am I?",
      suggestedInvocationPhrase: "Where Am I?",
    })
    // Test application integrity
    // setTimeout(() => {
    //   this.integrityService.testIntegrity();
    // }, 10000);
  }

  stackChanged() {
    if (!environment.production) {
      this.dbService.getWorkerLogs();
    }
  }
}
