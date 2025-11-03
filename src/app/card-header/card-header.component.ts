import { Component, input, output } from '@angular/core';
import { IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, stop } from 'ionicons/icons';

@Component({
  selector: 'app-card-header',
  templateUrl: './card-header.component.html',
  styleUrls: ['./card-header.component.scss'],
  imports: [IonFabButton, IonIcon],
})
export class CardHeaderComponent {
  icon = input<string>('add');
  title = input('Card Header');
  addClicked = output<void>();
  addHidden = input<boolean>(false);

  constructor() {
    addIcons({ arrowForwardOutline, stop });
  }
}
