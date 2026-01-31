import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Injectable, signal, inject } from '@angular/core';
import { randomInt } from '../utils/utils';
import { AlertController, IonContent, NavController, ToastController } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { NavigationBar } from '@webnativellc/capacitor-navigation-bar';
import { Share, ShareOptions } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { ScrollResult } from '../map/map-model';
import { FileSharer, ShareFileOptions } from '@webnativellc/capacitor-filesharer';
import { SplashScreen } from '@capacitor/splash-screen';
export const ThemePrimaryColor = '#F61067';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  public navCtrl = inject(NavController);
  public textZoom = signal(1);
  private clickedTab = signal('');

  constructor() {}

  public scrollUp(name: string, virtualScroll: CdkVirtualScrollViewport) {
    const tab = this.clickedTab();
    if (tab.startsWith(name)) {
      virtualScroll.scrollToIndex(0, 'smooth');
    }
  }

  public async setNavigationBar(color?: string) {
    if (this.isAndroid()) {
      const bcolor = color ? color : this.darkMode() ? '#000000' : '#FFFFFF';
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

  public async shareFile(options: ShareFileOptions) {
    await FileSharer.share(options);
  }

  public scrollUpContent(name: string, ionContent: IonContent) {
    const tab = this.clickedTab();
    if (tab.startsWith(name)) {
      console.log(`${name}: scroll to top`);
      ionContent.scrollToTop(100);
    }
  }

  public swipedRight(r: ScrollResult): boolean {
    if (r.deltaX > 200 && Math.abs(r.deltaY) < 100) {
      return true;
    }
    return false;
  }

  public swipedDown(r: ScrollResult): boolean {
    const largeDevice = window.innerHeight > 1000; // Eg iPad
    const swipeRequired = largeDevice ? 300 : 100;
    if (r.deltaY > swipeRequired && Math.abs(r.deltaX) < 50) {
      return true;
    }
    return false;
  }

  public async openUrl(url: string) {
    if (url.startsWith('tel:') || url.startsWith('mailto:')) {
      window.open(url, '_blank');
      return;
    }

    if (url.startsWith('./admin')) {
      await SplashScreen.show();
      location.href = url;
      return;
    }
    await Browser.open({ url, presentationStyle: 'popover' });
  }

  public async presentToast(message: string, toastController: ToastController, position?: any, duration?: number) {
    const toast = await toastController.create({
      message,
      color: 'primary',
      duration: duration ?? 1500,
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

  public async presentAlert(alert: AlertController, message: string, title?: string): Promise<void> {
    const a = await alert.create({
      header: title ?? 'Message',
      message,
      buttons: ['OK'],
    });

    await a.present();
    await a.onDidDismiss();
  }
}
