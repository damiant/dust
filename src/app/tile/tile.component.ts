import { Component, input } from '@angular/core';
import { IonButton, IonIcon, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  imports: [IonButton, IonIcon, IonText],
  standalone: true,
})
export class TileComponent {
  title = input('tile');
  imgSrc = input('');
  iconName = input<string>();
  constructor() {}
}
