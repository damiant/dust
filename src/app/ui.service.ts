import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Injectable, signal } from '@angular/core';
import { randomInt } from './utils';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private clickedTab = signal('');
  constructor() { }

  public scrollUp(name: string, virtualScroll: CdkVirtualScrollViewport) {
    const tab = this.clickedTab();
    if (tab.startsWith(name))  {
      console.log(`${name}: scroll to top`);
      virtualScroll.scrollToIndex(0);
    }
  }

  public setTab(name: string) {
    this.clickedTab.set(`${name}.${randomInt(1,9999999)}`);
  }
}
