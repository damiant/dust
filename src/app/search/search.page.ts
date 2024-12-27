import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonSpinner, IonList, IonItem, IonLabel, IonIcon, IonText } from '@ionic/angular/standalone';
import { SearchComponent } from './search.component';
import { DbService } from '../data/db.service';
import { RouterModule } from '@angular/router';

interface SearchItem {
  title: string;
  link: string;
  icon: string;
}

interface SearchState {
  items: SearchItem[];
  busy: boolean;
}
@Component({
    selector: 'app-search-page',
    templateUrl: './search.page.html',
    styleUrls: ['./search.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonText, IonIcon, IonLabel, IonItem, IonList, IonSpinner,
        IonBackButton,
        IonButtons,
        IonContent,
        IonHeader,
        IonIcon,
        IonTitle,
        IonToolbar,
        SearchComponent,
        CommonModule,
        RouterModule,
        FormsModule]
})
export class SearchPage {
  public vm: SearchState = { items: [], busy: false };
  private db = inject(DbService);
  private _change = inject(ChangeDetectorRef);
  constructor() { }


  async search(value: string) {
    try {
      if (typeof value === 'object') {
        return;
      }
      
      
      if (value.trim() == '') {
        this.vm.items = [];
        return;
      }
      this.vm.busy = true;
      const items: SearchItem[] = [];
      const top = 20;
      const list = await this.db.findAll(value, undefined, '', undefined, undefined, true, true, top);
      items.push(...this.asSearchItems(list.camps, 'camp', 'assets/icon/camp.svg'));
      items.push(...this.asSearchItems(list.art, 'art', 'assets/icon/art.svg'));
      items.push(...this.asSearchItems(list.events, 'event', 'assets/icon/calendar.svg'));
      items.sort((a: SearchItem, b: SearchItem) => {
        if (a.title.toLowerCase().includes(value.toLowerCase())) {
          return -1;
        }
        if (b.title.toLowerCase().includes(value.toLowerCase())) {
          return 1;
        }
        return 0;
      });
      this.vm.items = items;
    } finally {
      this.vm.busy = false;
      this._change.detectChanges();
    }
  }

  asSearchItems(items: any[], linkName: string, icon: string): SearchItem[] {
    const r: SearchItem[] = [];
    for (const item of items) {
      r.push({ title: item.name ?? item.title, icon, link: `/${linkName}/${item.uid}+Search` })
    }
    return r;
  }

}
