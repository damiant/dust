import { Component, input, output, model, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { BadgeComponent } from '../badge/badge.component';

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
  imports: [CommonModule, IonIcon, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBarComponent {
  tabs = input<Tab[]>([]);
  opened = input(false);
  selected = model<string | undefined>(undefined);
  tabSelected = output<string>();

  showLabels = computed(() => this.tabs().length <= 3);

  selectedIndex = computed(() => {
    const selectedId = this.selected();
    const tabs = this.tabs();
    if (!selectedId || tabs.length === 0) return -1;
    return tabs.findIndex((t) => t.id === selectedId);
  });

  handleKey(event: any) {
    if (event.keyCode === 13 || event.keyCode === 32) {
      event.preventDefault(); // Prevent default actions like page scrolling on Space
      event.target.click(); // Trigger the click event
    }
  }

  select(id: string) {
    this.selected.set(id);
    this.tabSelected.emit(id);    
  }
}
