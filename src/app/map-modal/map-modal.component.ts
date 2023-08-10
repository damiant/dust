import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { IonicModule } from '@ionic/angular';
import { MapPoint } from '../models';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
  standalone: true,
  imports: [MapComponent, IonicModule]
})
export class MapModalComponent  implements OnInit {
  @Input() show = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Output() showChange = new EventEmitter<boolean>();
  @Input() points: MapPoint[] = [];
  constructor() { }

  ngOnInit() {}

  close() {    
    this.show = false;
    this.showChange.emit(this.show);    
  }

  open() {
    this.show = true;
    this.showChange.emit(this.show);
  }

}
