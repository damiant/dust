import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IonCard, IonText, IonCardContent, ToastController, IonProgressBar } from '@ionic/angular/standalone';
import { CardHeaderComponent } from '../card-header/card-header.component';

import { CacheService, CacheStatus } from '../data/cache.service';
import { UiService } from '../ui/ui.service';
import { DbService } from '../data/db.service';

@Component({
  selector: 'app-cache-panel',
  templateUrl: './cache-panel.component.html',
  styleUrls: ['./cache-panel.component.scss'],
  standalone: true,
  imports: [IonProgressBar, IonCardContent, IonCard, IonText, CardHeaderComponent],
})
export class CachePanelComponent implements OnInit {
  cache = inject(CacheService);
  ui = inject(UiService);
  db = inject(DbService);
  toastController = inject(ToastController);
  cacheStatus = signal<CacheStatus>(this.cache.InitialCacheStatus());
  downloading = signal<boolean>(false);
  abortDownload = signal<boolean>(false);
  networkWarning = computed(() => {
    const status = this.db.networkStatus();
    if (status == 'cell') {
      return `You are on a cellular network. Downloading may incur data charges.`;
    }
    return ``;
  });
  isCached = signal<boolean>(true);
  private initialMessage = `To go completely offline you can download images and audio which may take a few minutes and can take 1 to 50mb of space.`;
  cachedMessage = signal(this.initialMessage);
  isOnline = computed(() => {
    const status = this.db.networkStatus();
    return status !== 'none';
  });

  async ngOnInit() {
    this.isCached.set(await this.cache.isCached());
    if (!(await this.cache.cachedBefore())) {
      this.cachedMessage.set(this.initialMessage);
    } else {
      this.cachedMessage.set(`Updates were applied but there may be images and audio which is not stored offlined.`);
    }
  }

  async goOffline() {
    try {
      if (this.downloading()) {
        // Stop
        this.abortDownload.set(true);
        return;
      }
      this.downloading.set(true);
      this.abortDownload.set(false);
      const status = await this.cache.download(this.cacheStatus, this.abortDownload);
      if (status !== '') {
        this.ui.presentToast(status, this.toastController);
      }
      this.isCached.set(await this.cache.isCached());
    } finally {
      this.downloading.set(false);
      this.cacheStatus.set(this.cache.InitialCacheStatus());
    }
  }
}
