import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { FriendComponent, FriendResult } from '../friend/friend.component';
import { FavoritesService } from '../favs/favorites.service';
import { Friend } from '../data/models';
import { CommonModule } from '@angular/common';
import { delay } from '../utils/utils';


@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
  imports: [IonicModule, CommonModule, FriendComponent],
  standalone: true
})
export class FriendsComponent implements OnInit {
  public friends: Friend[] = [];
  private editingFriend: Friend | undefined;

  constructor(private modalCtrl: ModalController, private fav: FavoritesService) {
  }

  ngOnInit() {
    this.update();
  }

  async addFriend(friend?: Friend) {
    const e: any = document.querySelector('.ion-page');
    const modal = await this.modalCtrl.create({
      component: FriendComponent,
      presentingElement: e,
      componentProps: friend ? {
        friend: friend,
        isEdit: (friend)
      } : undefined
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    delay(800); // Time for animation
    switch (role) {
      case FriendResult.confirm: {
        if (friend) {
          await this.fav.updateFriend(data, friend);
        } else {
          await this.fav.addFriend(data);
        }
        await this.update();
        return;
      }
      case FriendResult.delete: {
        await this.fav.deleteFriend(this.editingFriend!);
        await this.update();
        return;
      }
    }
  }

  async update() {
    const favs = await this.fav.getFavorites();
    this.friends = favs.friends;
  }

  async editFriend(friend: Friend) {
    this.editingFriend = structuredClone(friend);
    this.addFriend(friend);
  }

}
