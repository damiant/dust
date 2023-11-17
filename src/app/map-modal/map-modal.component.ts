import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { MapPoint } from '../data/models';
import { IonModal, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
  standalone: true,
  imports: [MapComponent, IonModal, IonText]
})
export class MapModalComponent {
  @Input() show = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Output() showChange = new EventEmitter<boolean>();
  @Input() points: MapPoint[] = [];
  constructor() { }



  close() {    
    this.show = false;
    this.showChange.emit(this.show);    
  }

  open() {
    this.show = true;
    this.showChange.emit(this.show);
  }

}
