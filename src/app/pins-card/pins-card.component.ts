import { Component, inject, input, output } from '@angular/core';
import { IonCard, IonCardHeader, IonItem, IonCardTitle, IonButton, IonIcon, IonNote, IonFabButton, ModalController } from "@ionic/angular/standalone";
import { Thing } from '../data/models';
import { locationOutline, add } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ThingComponent, ThingResult } from '../thing/thing.component';

import { clone, delay } from '../utils/utils';
import { FavoritesService } from '../favs/favorites.service';

@Component({
  selector: 'app-pins-card',
  templateUrl: './pins-card.component.html',
  styleUrls: ['./pins-card.component.scss'],
  standalone: true,
  imports: [IonFabButton, IonNote, IonIcon, IonButton, IonCardTitle, IonItem, IonCard, IonCardHeader, ThingComponent]
})
export class PinsCardComponent {
  private modalCtrl = inject(ModalController);
  private favs = inject(FavoritesService);
  things = input<Thing[]>([]);
  editingThing: Thing | undefined;
  clickThing = output<Thing>();
  constructor() {
    addIcons({ locationOutline, add });
  }

  doClickThing(thing: Thing) {
    this.clickThing.emit(thing);
  }

  async editThing(thing: Thing) {
    this.editingThing = clone(thing);
    this.addThing(thing);
  }

  async addThing(thing?: Thing) {
    const e: any = document.getElementById('my-outlet');
    const modal = await this.modalCtrl.create({
      component: ThingComponent,
      presentingElement: e,
      componentProps: thing
        ? {
          thing: thing,
          isEdit: thing,
        }
        : undefined,
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    console.log('data', data, role);
    delay(800); // Time for animation
    switch (role) {
      case ThingResult.confirm: {
        await this.favs.addThing(data);
        return;
      }
      case ThingResult.delete: {
        await this.favs.deleteThing(this.editingThing!);
        return;
      }
    }
  }


}
