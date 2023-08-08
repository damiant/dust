import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-skeleton-art',
  templateUrl: './skeleton-art.component.html',
  styleUrls: ['./skeleton-art.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class SkeletonArtComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
