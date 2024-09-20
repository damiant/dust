import { Component, input, OnInit, output } from '@angular/core';
import { IonFabButton, IonIcon } from "@ionic/angular/standalone";

@Component({
  selector: 'app-card-header',
  templateUrl: './card-header.component.html',
  styleUrls: ['./card-header.component.scss'],
  standalone: true,
  imports: [IonFabButton, IonIcon]
})
export class CardHeaderComponent implements OnInit {

  title = input('Card Header');
  addClicked = output<void>();
  addHidden = input<boolean>(false);
  constructor() { }

  ngOnInit() { }

}
