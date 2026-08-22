import { ChangeDetectionStrategy, Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { ScanService } from '../scan/scan.service';

export enum GetFavoritesResult {
  confirm = 'confirm',
  cancel = 'cancel',
}

@Component({
  selector: 'app-get-favorites',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cancel()">Cancel</ion-button>
        </ion-buttons>
        @if (showManualEntry()) {
          <ion-buttons slot="end">
            <ion-button (click)="confirm()">Apply</ion-button>
          </ion-buttons>
        }
        <ion-title>Get Favorites</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (!showManualEntry()) {
        <div class="get-favorites-actions">
          <ion-button expand="block" (click)="scanQrCode()">Scan QR code</ion-button>
          <ion-button expand="block" fill="outline" (click)="enterFavoriteIdManually()">
            Enter Favorite ID Manually
          </ion-button>
        </div>
      }

      @if (showManualEntry()) {
        <ion-item>
          <ion-label position="stacked">Enter the favorite ID</ion-label>
          <ion-input
            #favIdInput
            type="text"
            [(ngModel)]="uniqueId"
            placeholder="e.g., ab459f"
            maxlength="6"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
          ></ion-input>
        </ion-item>
      }

      @if (errorMessage()) {
        <ion-label class="error-message">{{ errorMessage() }}</ion-label>
      }
    </ion-content>
  `,
  styleUrls: ['./get-favorites.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    IonItem,
    IonButton,
    IonContent,
    IonButtons,
    IonToolbar,
    IonTitle,
    IonInput,
    IonHeader,
    IonLabel,
  ],
})
export class GetFavoritesComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private scanner = inject(ScanService);
  uniqueId = '';
  showManualEntry = signal(false);
  errorMessage = signal('');
  favIdInput = viewChild<IonInput>('favIdInput');

  ngOnInit() {
    void this.scanner.prepare();
  }

  enterFavoriteIdManually() {
    this.errorMessage.set('');
    this.showManualEntry.set(true);
    setTimeout(() => {
      void this.favIdInput()?.setFocus();
    });
  }

  async scanQrCode() {
    this.errorMessage.set('');
    const scannedId = await this.scanner.scan();
    if (!scannedId) {
      return;
    }

    const id = this.normalizeId(scannedId);
    if (!id) {
      this.errorMessage.set('The QR code does not contain a valid favorite ID.');
      return;
    }
    await this.modalCtrl.dismiss(id, GetFavoritesResult.confirm);
  }

  async cancel() {
    await this.modalCtrl.dismiss(null, GetFavoritesResult.cancel);
  }

  async confirm() {
    const id = this.normalizeId(this.uniqueId);
    if (!id) {
      this.errorMessage.set('Enter a valid six-character favorite ID.');
      return;
    }
    await this.modalCtrl.dismiss(id, GetFavoritesResult.confirm);
  }

  private normalizeId(value: string): string | undefined {
    const id = value?.trim().toLowerCase();
    return /^[a-z0-9]{6}$/.test(id) ? id : undefined;
  }
}
