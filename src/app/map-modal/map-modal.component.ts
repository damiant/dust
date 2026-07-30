import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { MapPoint } from '../data/models';
import { IonFab, IonFabButton, IonIcon, IonModal, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { MapPolygon } from '../map/map-model';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MapComponent, IonModal, IonText, IonFab, IonFabButton, IonIcon],
})
export class MapModalComponent {
  constructor() {
    addIcons({ close });
  }
  show = model(false);
  title = input('');
  subtitle = input('');
  points = input<MapPoint[]>([]);
  polygons = input<MapPolygon[]>([]);

  close() {
    this.show.set(false);
  }

  open() {
    this.show.set(true);
  }
}
