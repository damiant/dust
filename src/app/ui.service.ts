import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Injectable, signal } from '@angular/core';
import { randomInt } from './utils';
import { IonContent } from '@ionic/angular';

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
      virtualScroll.scrollToIndex(0, 'smooth');
    }
  }

  public scrollUpContent(name: string, ionContent: IonContent) {
    const tab = this.clickedTab();
    if (tab.startsWith(name))  {
      console.log(`${name}: scroll to top`);
      ionContent.scrollToTop(100);
    }
  }

  public setTab(name: string) {
    this.clickedTab.set(`${name}.${randomInt(1,9999999)}`);
  }
}
