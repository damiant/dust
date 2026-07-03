import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { IonButton, IonIcon, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon, IonText],
})
export class TileComponent {
  title = input('tile');
  imgSrc = input('');
  iconName = input<string>();
}
