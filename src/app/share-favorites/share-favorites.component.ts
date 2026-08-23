import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { Share } from '@capacitor/share';
import { Network } from '@capacitor/network';
import { addIcons } from 'ionicons';
import { shareOutline } from 'ionicons/icons';
import { FavoritesService } from '../favs/favorites.service';
import QRCode from 'qrcode';

export type ShareStatus = 'loading' | 'success' | 'failed' | 'no-network';

@Component({
  selector: 'app-share-favorites',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()">Close</ion-button>
        </ion-buttons>
        <ion-title>Share this favorite ID</ion-title>
        <ion-buttons slot="end">
          @if (status() === 'success') {
            <ion-button (click)="share()">
              <ion-icon color="primary" name="share-outline"></ion-icon>
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="share-container">
        @if (status() === 'loading') {
          <ion-spinner name="crescent"></ion-spinner>
        }
        @if (status() === 'success') {
          <canvas #qrCode class="favorite-qr" aria-label="QR code for your favorite ID"></canvas>
          <div class="favorite-id">{{ uniqueId() }}</div>
          <div class="favorite-info">{{ favoriteInfo() }}</div>
        }
        @if (status() === 'failed') {
          <div class="share-message failed">Failed to Share</div>
        }
        @if (status() === 'no-network') {
          <div class="share-message no-network">No Network</div>
        }
      </div>
    </ion-content>
  `,
  styleUrls: ['./share-favorites.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar],
})
export class ShareFavoritesComponent {
  private modalCtrl = inject(ModalController);
  private fav = inject(FavoritesService);

  status = signal<ShareStatus>('loading');
  uniqueId = signal<string>('');
  favoriteInfo = signal('');
  private qrCode = viewChild<ElementRef<HTMLCanvasElement>>('qrCode');

  constructor() {
    addIcons({ shareOutline });
    effect(() => {
      const id = this.uniqueId();
      const canvas = this.qrCode()?.nativeElement;
      if (id && canvas) {
        void QRCode.toCanvas(canvas, id, { width: 240, margin: 2 });
      }
    });
    this.start();
  }

  private async start() {
    try {
      const networkStatus = await Network.getStatus();
      if (!networkStatus.connected) {
        this.status.set('no-network');
        return;
      }
      const favorites = await this.fav.getFavorites();
      const id = await this.fav.shareFavorites();
      const eventCount = favorites.events.length + favorites.rslEvents.length;
      const campAndArtCount = favorites.camps.length + favorites.art.length;
      this.favoriteInfo.set(
        eventCount === 0 && campAndArtCount === 0
          ? 'You have not favorited any events, camps or art'
          : `On another phone choose “Scan Favorites” and point to this QR code, or choose “Enter ID” and type in this ID to download these ${eventCount} events, ${campAndArtCount} favorite camps & art`,
      );
      this.uniqueId.set(id);
      this.status.set('success');
    } catch (error) {
      console.error('Failed to share favorites', error);
      this.status.set('failed');
    }
  }

  async close() {
    await this.modalCtrl.dismiss();
  }

  async share() {
    try {
      await Share.share({
        title: 'Favorites',
        text: `Check out my favorites! Enter this ID: ${this.uniqueId()}`,
        dialogTitle: 'Share Favorites',
      });
    } catch (e: any) {
      if (e?.message !== 'Share canceled') {
        console.error('Share failed', e);
      }
    }
  }
}
