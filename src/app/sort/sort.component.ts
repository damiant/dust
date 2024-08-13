import { Component, input, model, output } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonTitle,
  IonItem, IonLabel, IonCheckbox
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locationSharp } from 'ionicons/icons';

@Component({
  selector: 'app-sort',
  templateUrl: './sort.component.html',
  styleUrls: ['./sort.component.scss'],
  standalone: true,
  imports: [IonCheckbox, IonLabel, IonItem, IonTitle, IonButton, IonContent, IonIcon],
})
export class SortComponent {
  sortType = model<string>('alpha');
  padChecked = input(true);
  sortTypeChange = output<string>();

  constructor() {
    addIcons({ locationSharp });
  }

  sortChanged(e: any) {
    this.sortType.set(e.detail.checked ? 'dist' : 'alpha');
    this.sortTypeChange.emit(this.sortType());
  }
}
