import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { IonCheckbox } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locationSharp } from 'ionicons/icons';

@Component({
  selector: 'app-sort',
  templateUrl: './sort.component.html',
  styleUrls: ['./sort.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonCheckbox],
})
export class SortComponent {
  sortType = signal('alpha');
  padChecked = input(true);
  sortTypeChange = output<string>();

  constructor() {
    addIcons({ locationSharp });
  }

  sortChanged(e: CustomEvent) {
    const value = e.detail.checked ? 'dist' : 'alpha';
    this.sortType.set(value);
    this.sortTypeChange.emit(value);
  }
}
