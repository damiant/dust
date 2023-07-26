import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MapPoint, toMapPoint } from '../map/map.component';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Event } from '../models';


export interface MapAction {
  location: string;
  title: string;
}

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule]
})
export class EventComponent  implements OnInit {

  @Input() event!: Event;
  @Input() title = 'Events';
  @Output() mapClick = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {}

  map(location: string, title: string) {
    this.mapClick.emit({ location, title });
  }

}
