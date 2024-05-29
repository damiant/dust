import { Component, input, model, output } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPopover,
  IonRadio,
  IonRadioGroup,
  IonTitle,
  IonItem,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDown } from 'ionicons/icons';

@Component({
  selector: 'app-sort',
  templateUrl: './sort.component.html',
  styleUrls: ['./sort.component.scss'],
  standalone: true,
  imports: [IonItem, IonTitle, IonButton, IonPopover, IonContent, IonRadioGroup, IonRadio, IonIcon],
})
export class SortComponent {
  sortTypes = [
    { title: 'Sort by Distance', value: 'dist' },
    { title: 'Sort Alphabetically', value: 'alpha' },
  ];
  id = input('');
  allTitle = input<string>('');
  sortType = model<string>('alpha');
  sortTypeChange = output<string>();

  constructor() {
    addIcons({ chevronDown });
  }

  sortChanged(e: any) {
    this.sortType.set(e.detail.value);
    this.sortTypeChange.emit(this.sortType());
  }
}
