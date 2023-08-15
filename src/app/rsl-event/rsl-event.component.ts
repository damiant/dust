import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RSLEvent } from '../models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rsl-event',
  templateUrl: './rsl-event.component.html',
  styleUrls: ['./rsl-event.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, CommonModule]
})
export class RslEventComponent implements OnInit {

  @Input() event!: RSLEvent;
  @Output() mapClick = new EventEmitter<RSLEvent>();

  constructor() { }

  ngOnInit() { }

  map(event: RSLEvent) {
    this.mapClick.emit(event);
  }

}
