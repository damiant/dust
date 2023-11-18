import { Component, EnvironmentInjector, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from './notifications/notification.service';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { ShareInfoType, ShareService } from './share/share.service';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { RouterFocusService } from './utils/focus.service';
import { defineCustomElement } from '@ionic/core/components/ion-modal.js';

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
    private shareService: ShareService,
    private zone: NgZone,
    private focusService: RouterFocusService,
  ) {}

  async ngOnInit() {
    // This is required to fix tree shaking until this issue is resolved: https://github.com/ionic-team/ionic-framework/issues/28385
    defineCustomElement();
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
  }

  stackChanged() {
    this.focusService.focus();
  }
}
