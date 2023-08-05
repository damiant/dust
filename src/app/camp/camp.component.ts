import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Camp } from '../models';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-camp',
  templateUrl: './camp.component.html',
  styleUrls: ['./camp.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class CampComponent  implements OnInit {

  @Input() camp!: Camp;
  @Input() title = 'Camps';
  @Output() mapClick = new EventEmitter<any>();
  constructor() { }

  ngOnInit() {}

  map(camp: Camp) {
    console.log('emit', camp);
    this.mapClick.emit(camp);
  }

}
