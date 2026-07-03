import { Component, input, model, output, ChangeDetectionStrategy, linkedSignal } from '@angular/core';
import { IonCheckbox } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locationSharp } from 'ionicons/icons';

@Component({
  selector: 'app-sort',
  templateUrl: './sort.component.html',
  styleUrls: ['./sort.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonCheckbox],
})
export class SortComponent {
  sortTypeInput = input<string>('alpha', { alias: 'sortType' });
  sortType = linkedSignal(this.sortTypeInput);
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
