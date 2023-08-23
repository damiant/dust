import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FriendComponent, FriendResult } from '../friend/friend.component';
import { FavoritesService } from '../favs/favorites.service';
import { Friend, PrivateEvent } from '../data/models';
import { CommonModule } from '@angular/common';
import { BurningManTimeZone, delay, getDayName } from '../utils/utils';
import { PrivateEventComponent, PrivateEventResult } from '../private-event/private-event.component';
import { UiService } from '../ui/ui.service';


@Component({
  selector: 'app-private-events',
  templateUrl: './private-events.component.html',
  styleUrls: ['./private-events.component.scss'],
  imports: [IonicModule, CommonModule, FriendComponent],
  standalone: true
})
export class PrivateEventsComponent implements OnInit {
  public events: PrivateEvent[] = [];
  private editingPrivateEvent: PrivateEvent | undefined;

  constructor(private modalCtrl: ModalController, private fav: FavoritesService, private ui: UiService, private toastController: ToastController) {
  }

  ngOnInit() {
    this.update();
  }

  async addPrivateEvent(event?: PrivateEvent) {
    const e: any = document.getElementById('my-outlet');
    const modal = await this.modalCtrl.create({
      component: PrivateEventComponent,
      presentingElement: e,
      componentProps: event ? {
        event: event,
        isEdit: (event)
      } : undefined
    });
    modal.present();

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
      event.startTime = new Date(event.start).toLocaleTimeString('en-US', { timeZone: BurningManTimeZone, hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    }
    this.events = favs.privateEvents;

  }

  async editPrivateEvent(event: PrivateEvent) {
    this.editingPrivateEvent = structuredClone(event);
    this.addPrivateEvent(event);
  }

}
