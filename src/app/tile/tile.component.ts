import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  imports: [IonicModule],
  standalone: true
})
export class TileComponent implements OnInit {

  @Input() title = 'tile';
  @Input() imgSrc = '';
  @Input() iconName: string | undefined;
  constructor() { }

  ngOnInit() { }

}
