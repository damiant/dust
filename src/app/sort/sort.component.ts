import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonContent, IonIcon, IonPopover, IonRadio, IonRadioGroup, IonTitle, IonItem } from '@ionic/angular/standalone';
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
  sortTypes = [{ title: 'Sort by Distance', value: 'dist' }, { title: 'Sort Alphabetically', value: 'alpha' }];
  @Input() id = '';
  @Input() allTitle: string = '';
  @Input() sortType: string = 'alpha';
  @Output() sortTypeChange = new EventEmitter<string>();

  constructor() {
    addIcons({ chevronDown });
  }

  sortChanged(e: any) {
    this.sortType = e.detail.value;
    this.sortTypeChange.emit(this.sortType);
  }
}
