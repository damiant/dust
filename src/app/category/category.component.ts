import { ChangeDetectionStrategy, Component, input, model, output, signal, viewChild } from '@angular/core';
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
  popover = viewChild.required<IonPopover>('popover');
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

  async open(event: Event) {
    this.popover().event = event;
    await this.popover().present();
  }

  changed(e: CustomEvent) {
    this.category.set(e.detail.value);
  }

  sortChanged(e: CustomEvent) {
    this.sortType.set(e.detail.value);
    this.sortTypeChange.emit(this.sortType());
  }
}
