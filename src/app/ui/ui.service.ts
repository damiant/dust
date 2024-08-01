import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Injectable, signal, inject } from '@angular/core';
import { randomInt } from '../utils/utils';
import { IonContent, NavController, ToastController } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { NavigationBar } from '@mauricewegner/capacitor-navigation-bar';
import { Share, ShareOptions } from '@capacitor/share';
import { Router } from '@angular/router';
import { Browser } from '@capacitor/browser';

export const ThemePrimaryColor = '#F61067';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  private router = inject(Router);
  public navCtrl = inject(NavController);
  private clickedTab = signal('');

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

  public async openUrl(url: string) {
    if (url.startsWith('tel:') || url.startsWith('mailto:')) {
      window.open(url, '_blank');
      return;
    }
    await Browser.open({ url, presentationStyle: 'popover' });
  }

  public async presentToast(message: string, toastController: ToastController, position?: any) {
    const toast = await toastController.create({
      message,
      color: 'primary',
      duration: 1500,
      swipeGesture: 'vertical',
      position: position ? position : 'top',
    });

    await toast.present();
  }

  public async presentDarkToast(message: string, toastController: ToastController) {
    const toast = await toastController.create({
      message,
      color: 'dark',
      duration: 2500,
      swipeGesture: 'vertical',
      position: 'top',
    });

    await toast.present();
  }

  public setStatusBarBasedOnTheme() {
    if (Capacitor.isNativePlatform()) {
      setTimeout(async () => {
        this.setNavigationBar();
        StatusBar.setStyle({ style: this.darkMode() ? Style.Dark : Style.Light });
        this.setStatusBarBackgroundColor(this.darkMode() ? '#000000' : '#FFFFFF');
      }, 100);
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

  public isAndroid(): boolean {
    return Capacitor.getPlatform() == 'android';
  }

  public darkMode(): boolean {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
