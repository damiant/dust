import { Component, input, model, output } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { MapPoint } from '../data/models';
import { IonFab, IonFabButton, IonIcon, IonModal, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
  imports: [MapComponent, IonModal, IonText, IonFab, IonFabButton, IonIcon],
})
export class MapModalComponent {
  constructor() {
    addIcons({ close });
  }
  show = model(false);
  title = input('');
  subtitle = input('');
  showChange = output<boolean>();
  points = input<MapPoint[]>([]);

  close() {
    this.show.set(false);
    this.showChange.emit(this.show());
  }

  open() {
    this.show.set(true);
    this.showChange.emit(this.show());
  }
}
