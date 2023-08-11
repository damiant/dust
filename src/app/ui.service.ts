import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Injectable, signal } from '@angular/core';
import { delay, randomInt } from './utils';
import { IonContent, NavController } from '@ionic/angular';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { NavigationBar } from '@mauricewegner/capacitor-navigation-bar';
import { Share, ShareOptions } from '@capacitor/share';
import { Router } from '@angular/router';

export const ThemePrimaryColor = '#F61067';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private clickedTab = signal('');
  constructor(private router: Router, public navCtrl: NavController) { }

  public scrollUp(name: string, virtualScroll: CdkVirtualScrollViewport) {
    const tab = this.clickedTab();
    if (tab.startsWith(name)) {
      console.log(`${name}: scroll to top`);
      virtualScroll.scrollToIndex(0, 'smooth');
    }
  }

  public async setNavigationBar(color?: string) {
    if (this.isAndroid()) {
      let bcolor = color ? color : this.darkMode() ? '#000000' : '#FFFFFF';
      await NavigationBar.setColor({ color: bcolor, darkButtons: !this.darkMode() });
    }
  }

  public async hideNavigationBar() {
    if (this.isAndroid()) {
      await NavigationBar.hide();
    }
  }

  public async share(options: ShareOptions) {
    await Share.share(options);
  }

  public scrollUpContent(name: string, ionContent: IonContent) {
    const tab = this.clickedTab();
    if (tab.startsWith(name)) {
      console.log(`${name}: scroll to top`);
      ionContent.scrollToTop(100);
    }
  }

  public setTab(name: string) {
    this.clickedTab.set(`${name}.${randomInt(1, 9999999)}`);
  }

  public async home() {
    if (Capacitor.isNativePlatform()) {
      await StatusBar.setStyle({ style: Style.Dark });
      await this.setStatusBarBackgroundColor();
    }

    this.navCtrl.navigateRoot('/', { animated: false });
  }

  public async setStatusBarBackgroundColor(color?: string) {
    if (this.isAndroid()) {
      await StatusBar.setBackgroundColor({ color: color ? color : ThemePrimaryColor });
    }
  }

  private isAndroid(): boolean {
    return (Capacitor.getPlatform() == 'android');
  }

  public darkMode(): boolean {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
}
