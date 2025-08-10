import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, effect, inject } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonText,
} from '@ionic/angular/standalone';
import { FavoritesService } from '../favs/favorites.service';
import { FriendsService } from './friends.service';
import { Friend } from '../data/models';
import { CommonModule } from '@angular/common';
import { clone } from '../utils/utils';
import { addIcons } from 'ionicons';
import { add, person } from 'ionicons/icons';
import { CardHeaderComponent } from "../card-header/card-header.component";
import { DbService } from '../data/db.service';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonList,
    IonText,
    IonItem,
    IonIcon,
    IonLabel,
    CardHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendsComponent implements OnInit {
  private fav = inject(FavoritesService);
  private db = inject(DbService);
  private friendsService = inject(FriendsService);
  public friends: Friend[] = [];
  private _change = inject(ChangeDetectorRef);
  private editingFriend: Friend | undefined;


  constructor() {
    addIcons({ add, person });
    effect(() => {
      const change = this.fav.changed();
      if (change > 1) {
        this.update();
      }
    });
  }

  ngOnInit() {
    this.checkFriendsCamps();
    this.update();
  }

  private async checkFriendsCamps() {
    if (this.db.locationsHidden().camps) return;
    let updates = false;
    const favs = await this.fav.getFavorites();
    for (const friend of favs.friends) {
      if (friend.camp && friend.camp.length > 0) {
        const camp = await this.db.findCamp(friend.camp);
        if (camp && camp.location_string && friend.address.length === 0) {
          const before = clone(friend);
          friend.address = camp.location_string;
          await this.fav.updateFriend(friend, before);
          console.log(`Friend ${friend.name} has camp address: ${friend.address}`);
          updates = true;
        }
      }
    }
    if (updates) {
      this.update();
    }
  }

  async addFriend(friend?: Friend) {
    if (friend) {
      this.editingFriend = clone(friend);
    }
    await this.friendsService.addFriend(friend);
    await this.update();
  }

  async update() {
    const favs = await this.fav.getFavorites();
    this.friends = favs.friends;
    this._change.markForCheck();
  }

  async editFriend(friend: Friend) {
    this.editingFriend = clone(friend);
    await this.addFriend(friend);
  }
}
