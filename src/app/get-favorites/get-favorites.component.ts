import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
import { addIcons } from 'ionicons';
import { download } from 'ionicons/icons';

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
        <ion-buttons slot="end">
          <ion-button (click)="confirm()">Apply</ion-button>
        </ion-buttons>
        <ion-title>Get Favorites</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-item>
        <ion-label position="stacked">Enter the favorite ID</ion-label>
        <ion-input
          type="text"
          [(ngModel)]="uniqueId"
          placeholder="e.g., ab459f"
          maxlength="6"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
        ></ion-input>
      </ion-item>
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
export class GetFavoritesComponent {
  private modalCtrl = inject(ModalController);
  uniqueId: string = '';

  constructor() {
    addIcons({ download });
  }

  async cancel() {
    await this.modalCtrl.dismiss(null, GetFavoritesResult.cancel);
  }

  async confirm() {
    const id = this.uniqueId?.trim().toLowerCase();
    if (!id || id.length === 0) {
      return;
    }
    await this.modalCtrl.dismiss(id, GetFavoritesResult.confirm);
  }
}
