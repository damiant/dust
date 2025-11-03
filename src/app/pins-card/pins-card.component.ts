import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input, output } from '@angular/core';
import { IonCard, IonItem, IonIcon, IonNote, ModalController } from '@ionic/angular/standalone';
import { Thing } from '../data/models';
import { locationOutline, add } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ThingComponent, ThingResult } from '../thing/thing.component';

import { clone, delay } from '../utils/utils';
import { FavoritesService } from '../favs/favorites.service';
import { CardHeaderComponent } from '../card-header/card-header.component';

@Component({
  selector: 'app-pins-card',
  templateUrl: './pins-card.component.html',
  styleUrls: ['./pins-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonNote, IonIcon, IonItem, IonCard, CardHeaderComponent],
})
export class PinsCardComponent {
  private modalCtrl = inject(ModalController);
  private favs = inject(FavoritesService);
  private _change = inject(ChangeDetectorRef);
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
        this._change.markForCheck();
        return;
      }
      case ThingResult.delete: {
        await this.favs.deleteThing(this.editingThing!);
        this._change.markForCheck();
        return;
      }
    }
  }
}
