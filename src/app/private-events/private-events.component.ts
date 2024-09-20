import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonFabButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { FriendComponent } from '../friend/friend.component';
import { FavoritesService } from '../favs/favorites.service';
import { PrivateEvent } from '../data/models';
import { CommonModule } from '@angular/common';
import { clone, delay, getDayName } from '../utils/utils';
import { PrivateEventComponent, PrivateEventResult } from '../private-event/private-event.component';
import { UiService } from '../ui/ui.service';
import { addIcons } from 'ionicons';
import { add, calendar } from 'ionicons/icons';
import { SettingsService } from '../data/settings.service';
import { CardHeaderComponent } from '../card-header/card-header.component';

@Component({
  selector: 'app-private-events',
  templateUrl: './private-events.component.html',
  styleUrls: ['./private-events.component.scss'],
  imports: [
    CommonModule,
    FriendComponent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonFabButton,
    IonIcon,
    IonCardContent,
    IonList,
    IonText,
    IonItem,
    IonLabel,
    CardHeaderComponent
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateEventsComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private fav = inject(FavoritesService);
  private settings = inject(SettingsService);
  private ui = inject(UiService);
  private toastController = inject(ToastController);
  public events: PrivateEvent[] = [];
  private editingPrivateEvent: PrivateEvent | undefined;
  private _change = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ add, calendar });
  }

  ngOnInit() {
    this.update();
  }

  async addPrivateEvent(event?: PrivateEvent) {
    const e: any = document.getElementById('my-outlet');
    const modal = await this.modalCtrl.create({
      component: PrivateEventComponent,
      presentingElement: e,
      componentProps: event
        ? {
          event: event,
          isEdit: event,
          showAddress: this.settings.isBurningMan()
        }
        : {
          isEdit: false,
          showAddress: this.settings.isBurningMan()
        },
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    delay(800); // Time for animation
    switch (role) {
      case PrivateEventResult.confirm: {
        if (event) {
          await this.fav.updatePrivateEvent(data, event);
        } else {
          const result = await this.fav.addPrivateEvent(data);
          if (result) {
            this.ui.presentToast(result, this.toastController);
          }
        }
        await this.update();
        return;
      }
      case PrivateEventResult.delete: {
        await this.fav.deletePrivateEvent(this.editingPrivateEvent!);
        await this.update();
        return;
      }
    }
  }

  async update() {
    const favs = await this.fav.getFavorites();
    for (let event of favs.privateEvents) {
      event.startDay = getDayName(event.start);

      event.startTime = new Date(event.start)
        .toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
        .toLowerCase();
    }

    this.events = favs.privateEvents;
    this._change.markForCheck();
  }

  async editPrivateEvent(event: PrivateEvent) {
    this.editingPrivateEvent = clone(event);
    this.addPrivateEvent(event);
  }
}
