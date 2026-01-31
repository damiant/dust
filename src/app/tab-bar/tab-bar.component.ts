import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonBadge } from '@ionic/angular/standalone';

export interface Tab {
  id: string;
  iconName?: string;
  iconSrc?: string;
  label: string;
  badge?: number;
}

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
  imports: [CommonModule, IonIcon, IonBadge],
})
export class TabBarComponent {
  tabs = input<Tab[]>([]);
  selected = input<string | undefined>(undefined);
  tabSelected = output<string>();

  select(id: string) {
    this.tabSelected.emit(id);
  }
}
