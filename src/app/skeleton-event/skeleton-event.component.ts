import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-skeleton-event',
  templateUrl: './skeleton-event.component.html',
  styleUrls: ['./skeleton-event.component.scss'],
  standalone: true,
  imports: [ IonicModule]
})
export class SkeletonEventComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
