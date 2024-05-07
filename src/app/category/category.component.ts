import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonContent, IonIcon, IonPopover, IonRadio, IonRadioGroup, IonTitle, IonItem } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDown } from 'ionicons/icons';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  standalone: true,
  imports: [IonItem, IonTitle, IonButton, IonPopover, IonContent, IonRadioGroup, IonRadio, IonIcon],
})
export class CategoryComponent {
  sortTypes = [{ title: 'Distance', value: 'dist' }, { title: 'Time', value: 'alpha' }];
  @Input() id = '';
  @Input() allTitle: string = '';
  @Input() category: string = '';
  @Input() categories: string[] = [];
  @Input() sortType: string = 'alpha';
  @Input() showSortBy: boolean = false;
  @Output() categoryChange = new EventEmitter<string>();
  @Output() sortTypeChange = new EventEmitter<string>();

  constructor() {
    addIcons({ chevronDown });
  }

  changed(e: any) {
    this.category = e.detail.value;
    this.categoryChange.emit(this.category);
  }

  sortChanged(e: any) {
    this.sortType = e.detail.value;
    this.sortTypeChange.emit(this.sortType);
  }
}
