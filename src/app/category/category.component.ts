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
    selector: 'app-category',
    templateUrl: './category.component.html',
    styleUrls: ['./category.component.scss'],
    imports: [IonItem, IonButton, IonPopover, IonContent, IonRadioGroup, IonRadio, IonIcon]
})
export class CategoryComponent {
  sortTypes = [
    { title: 'Distance', value: 'dist' },
    { title: 'Time', value: 'alpha' },
  ];
  id = input('');
  allTitle = input<string>('');
  category = model<string>('');
  categories = input<string[]>([]);
  sortType = model<string>('alpha');
  showSortBy = input<boolean>(false);
  categoryChange = output<string>();
  sortTypeChange = output<string>();

  constructor() {
    addIcons({ chevronDown });
  }

  changed(e: any) {
    this.category.set(e.detail.value);
    this.categoryChange.emit(this.category());
  }

  sortChanged(e: any) {
    this.sortType.set(e.detail.value);
    this.sortTypeChange.emit(this.sortType());
  }
}
