import { Component, input, output } from '@angular/core';
import { IonFabButton, IonIcon } from "@ionic/angular/standalone";

@Component({
  selector: 'app-card-header',
  templateUrl: './card-header.component.html',
  styleUrls: ['./card-header.component.scss'],
  standalone: true,
  imports: [IonFabButton, IonIcon]
})
export class CardHeaderComponent {

  title = input('Card Header');
  addClicked = output<void>();
  addHidden = input<boolean>(false);
}
