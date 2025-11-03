import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { FriendComponent, FriendResult } from '../friend/friend.component';
import { Friend } from '../data/models';
import { FavoritesService } from '../favs/favorites.service';
import { delay } from '../utils/utils';

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  private modalCtrl = inject(ModalController);
  private fav = inject(FavoritesService);

  async addFriend(friend?: Friend, add?: boolean): Promise<boolean> {
    const e: any = document.getElementById('my-outlet');
    const modal = await this.modalCtrl.create({
      component: FriendComponent,
      presentingElement: e,
      componentProps: friend
        ? {
            friend: friend,
            isEdit: friend && !add,
          }
        : undefined,
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    delay(800); // Time for animation
    switch (role) {
      case FriendResult.confirm: {
        if (friend && !add) {
          await this.fav.updateFriend(data, friend);
        } else {
          await this.fav.addFriend(data);
        }
        return true;
      }
      case FriendResult.delete: {
        // When deleting, the friend parameter is the original friend being edited
        await this.fav.deleteFriend(friend!);
        return false;
      }
    }
    return false;
  }
}
