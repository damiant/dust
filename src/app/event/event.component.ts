import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Event } from '../data/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class EventComponent  implements OnInit {

  @Input() event!: Event;
  @Input() title = 'Events';
  @Input() day: Date | undefined;
  @Input() longTime = false;
  @Output() mapClick = new EventEmitter<any>();
  @Output() groupClick = new EventEmitter<Event>();
  @Output() rslClick = new EventEmitter<string>();

  constructor(private router: Router) { }

  ngOnInit() {}

  map(event: Event) {
    this.mapClick.emit(event);
  }

  group(event: Event) {
    this.groupClick.emit(event);
  }

  getDay() {
    return this.day;
  }

  detail() {
    if (this.event.uid === '') {
      this.rslClick.emit(this.event.slug);
      return;
    }
    this.router.navigateByUrl('/event/'+ this.event.uid + '+' + this.title);
  }

}
