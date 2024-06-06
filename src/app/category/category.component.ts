import { Component, computed, input, model, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPopover,
  IonRadio,
  IonRadioGroup,
  IonTitle,
  IonItem, IonCheckbox, IonFooter, IonButtons, IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDown } from 'ionicons/icons';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  standalone: true,
  imports: [IonToolbar, IonButtons, IonFooter, IonCheckbox, IonItem, IonTitle, IonButton,
    IonPopover, IonContent, IonRadioGroup, IonRadio, IonIcon, FormsModule],
})
export class CategoryComponent {
  sortTypes = [
    { title: 'Distance', value: 'dist' },
    { title: 'Time', value: 'alpha' },
  ];
  id = input('');
  popover = viewChild.required<IonPopover>(IonPopover);
  allTitle = input<string>('');
  categories = input<string[]>([]);
  sortType = model<string>('alpha');
  showSortBy = input<boolean>(false);
  categoryChange = output<any>();
  sortTypeChange = output<string>();
  selectedCategories: any = {}
  categoryModified = computed(() => {
    for (const category of this.categories()) {
      this.selectedCategories[category] = false;
    }
  });

  constructor() {
    addIcons({ chevronDown });
  }

  sortChanged(e: any) {
    this.sortType.set(e.detail.value);
    this.sortTypeChange.emit(this.sortType());
  }

  apply() {
    console.log(this.selectedCategories);
    this.popover().dismiss();
    this.categoryChange.emit(this.selectedCategories);
  }

  clear() {
    for (const category of this.categories()) {
      this.selectedCategories[category] = false;
    }
    this.popover().dismiss();
    this.categoryChange.emit(undefined);
  }
}
