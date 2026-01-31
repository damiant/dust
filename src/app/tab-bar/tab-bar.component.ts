import { Component, input, output, model, viewChildren, ElementRef, computed } from '@angular/core';
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
  selected = model<string | undefined>(undefined);
  tabSelected = output<string>();

  tabItems = viewChildren<ElementRef>('tabItem');

  indicatorStyle = computed(() => {
    const selectedId = this.selected();
    const tabs = this.tabs();
    const items = this.tabItems();

    if (!selectedId || items.length === 0) {
      return { opacity: 0 };
    }

    const index = tabs.findIndex((t) => t.id === selectedId);
    if (index === -1 || !items[index]) {
      return { opacity: 0 };
    }

    const el = items[index].nativeElement as HTMLElement;
    return {
      left: `${el.offsetLeft}px`,
      width: `${el.offsetWidth}px`,
      height: `${el.offsetHeight}px`,
      top: `${el.offsetTop}px`,
      opacity: 1,
    };
  });

  select(id: string) {
    this.selected.set(id);
    this.tabSelected.emit(id);
  }
}
