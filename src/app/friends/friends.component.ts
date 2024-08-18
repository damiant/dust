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
} from '@ionic/angular/standalone';
import { FriendComponent, FriendResult } from '../friend/friend.component';
import { FavoritesService } from '../favs/favorites.service';
import { Friend } from '../data/models';
import { CommonModule } from '@angular/common';
import { clone, delay } from '../utils/utils';
import { addIcons } from 'ionicons';
import { add, person } from 'ionicons/icons';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
  imports: [
    CommonModule,
    FriendComponent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonFabButton,
    IonCardContent,
    IonList,
    IonText,
    IonItem,
    IonIcon,
    IonLabel,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendsComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private fav = inject(FavoritesService);
  public friends: Friend[] = [];
  private _change = inject(ChangeDetectorRef);
  private editingFriend: Friend | undefined;

  constructor() {
    addIcons({ add, person });
  }

  ngOnInit() {
    this.update();
  }

  async addFriend(friend?: Friend) {
    const e: any = document.getElementById('my-outlet');
    const modal = await this.modalCtrl.create({
      component: FriendComponent,
      presentingElement: e,
      componentProps: friend
        ? {
          friend: friend,
          isEdit: friend,
        }
        : undefined,
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
    this._change.markForCheck();
  }

  async editFriend(friend: Friend) {
    this.editingFriend = clone(friend);
    this.addFriend(friend);
  }
}
