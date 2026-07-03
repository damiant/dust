import { Component, input, model, output, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPopover,
  IonRadio,
  IonRadioGroup,
  IonItem,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDown } from 'ionicons/icons';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonItem, IonButton, IonPopover, IonContent, IonRadioGroup, IonRadio, IonIcon],
})
export class CategoryComponent {
  sortTypes = [
    { title: 'Distance', value: 'dist' },
    { title: 'Time', value: 'alpha' },
  ];
  id = input('');
  allTitle = input<string>('');
  category = model('');
  categories = input<string[]>([]);
  sortType = signal('alpha');
  showSortBy = input<boolean>(false);
  sortTypeChange = output<string>();

  constructor() {
    addIcons({ chevronDown });
  }

  changed(e: CustomEvent) {
    this.category.set(e.detail.value);
  }

  sortChanged(e: CustomEvent) {
    this.sortType.set(e.detail.value);
    this.sortTypeChange.emit(this.sortType());
  }
}
