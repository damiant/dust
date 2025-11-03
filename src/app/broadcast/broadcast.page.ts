import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonCardHeader,
  IonButtons,
  IonBackButton,
  IonFabButton,
  IonFab,
} from '@ionic/angular/standalone';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { CallbackID, Geolocation, Position } from '@capacitor/geolocation';
import { AlertController } from '@ionic/angular';
import { locationSharp, wifiSharp, cafeSharp } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ConnectionStatus, Network } from '@capacitor/network';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { broadcastPost, encryptedMV, liveBurnId } from './utils';
import { delay } from 'src/app/utils/utils';
import { Art } from 'src/app/data/models';
import { UiService } from 'src/app/ui/ui.service';
import { DbService } from '../data/db.service';
import { SettingsService } from '../data/settings.service';
import { PinEntryComponent } from '../pin-entry/pin-entry.component';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-broadcast',
  templateUrl: './broadcast.page.html',
  styleUrls: ['./broadcast.page.scss'],
  standalone: true,
  imports: [
    IonFab,
    IonFabButton,
    IonBackButton,
    IonIcon,
    PinEntryComponent,
    IonButton,
    RouterModule,
    IonButtons,
    IonCardHeader,
    IonCardContent,
    IonCard,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
  ],
})
export class BroadcastPage implements OnInit {
  public art = signal<Art | undefined>(undefined);
  public running = signal(false);
  public processing = signal(false);
  public wifi = signal(false);
  public location = signal(false);
  public apiError = signal(false);
  public awake = signal(false);
  public authenticated = signal(false);
  public busy = signal(true);
  public message = signal('');
  public pin = signal('0000');

  private datasetId = '';
  private route = inject(ActivatedRoute);
  private ui = inject(UiService);
  private alert = inject(AlertController);
  private settings = inject(SettingsService);
  private watchId: CallbackID | undefined;
  private position: Position | undefined;
  private db = inject(DbService);
  private locationR = inject(Location);
  private connectionStatus: ConnectionStatus | undefined;

  constructor() {
    addIcons({ locationSharp, wifiSharp, cafeSharp });
  }

  async ngOnInit(): Promise<void> {
    const tmp = this.route.snapshot.paramMap.get('id')?.split('+');
    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.art.set(await this.db.findArt(id));
    this.pin.set(encryptedMV(this.art()!.uid));
    const existing = await this.settings.get(`mv-pin-${this.art()?.uid}`);
    if (existing == this.pin()) {
      this.authenticated.set(true);
      setTimeout(() => {
        this.start();
      }, 500);
    }
    this.datasetId = liveBurnId(this.settings.settings.datasetId);
    this.busy.set(false);

    this.setMessage();
    Network.addListener('networkStatusChange', (status) => {
      this.processNetwork(status);
    });
  }

  async start(): Promise<void> {
    try {
      this.processing.set(true);
      this.watchId = await Geolocation.watchPosition({}, (position) => {
        if (!position) {
          this.location.set(false);
          console.error('No position');
          return;
        }
        this.processPosition(position);
      });
      this.processPosition(await Geolocation.getCurrentPosition());
      this.running.set(true);
      this.processNetwork(await Network.getStatus());
      await this.keepAwake(true);
    } catch (err) {
      await this.ui.presentAlert(this.alert, `Unable to start geolocation watching: ${JSON.stringify(err)}`, `Error`);
    } finally {
      this.processing.set(false);
    }
  }

  checkNetwork(): void {
    if (!this.connectionStatus) {
      this.ui.presentAlert(this.alert, `Network is disabled.`);
      return;
    }
    let type = '';
    switch (this.connectionStatus.connectionType) {
      case 'wifi':
        type = 'WiFi ';
        break;
      case 'cellular':
        type = 'Cellular ';
        break;
      case 'none':
        type = '';
        break;
      default:
        type = '';
        break;
    }
    let message = `${type}Network is ${this.connectionStatus.connected ? 'connected' : 'disconnected'}.`;
    if (this.apiError() && this.connectionStatus.connected) {
      message += `Network appears to be connected but unable to broadcast ${this.art()?.name}'s location. Possible bad cell service or backend error.`;
    }
    this.ui.presentAlert(this.alert, message, `Network Status`);
  }

  async checkAwake(): Promise<void> {
    const result = await KeepAwake.isSupported();
    if (result.isSupported) {
      this.ui.presentAlert(this.alert, `Your device supports keeping the screen awake.`, `Awake Status`);
    } else {
      this.ui.presentAlert(this.alert, `Your device does not support keeping the screen awake.`, 'Error');
    }
  }

  checkLocation(): void {
    if (!this.position) {
      this.ui.presentAlert(this.alert, `Location is disabled.`);
      return;
    }
    this.ui.presentAlert(
      this.alert,
      `Last location was ${this.position.coords.latitude}, ${this.position.coords.longitude} at ${this.timeStamp()}.`,
      `Location Status`,
    );
  }

  private processPosition(position: Position): void {
    console.log(`Processing position ${position}`);
    this.position = position;
    this.broadcast(position);
    this.setMessage();
  }

  private processNetwork(status: ConnectionStatus): void {
    this.wifi.set(status.connected);
    this.connectionStatus = status;
  }

  private timeStamp(): string {
    const d = new Date(this.position?.timestamp || 0);
    //d.setUTCSeconds(this.position?.timestamp || 0);
    return d.toLocaleTimeString();
  }

  private setMessage(): void {
    if (this.apiError()) {
      this.message.set(`Error: Unable to broadcast ${this.art()?.name}'s location to the dust app.`);
    }
    if (this.position) {
      this.message.set(`${this.art()?.name}'s location is being broadcast to the dust app.`);
      this.location.set(true);
    } else {
      this.message.set(
        `This will broadcast the location of ${this.art()?.name} so that users of the dust app can find it on the map.`,
      );
      this.location.set(false);
    }
  }

  private async broadcast(position: Position): Promise<void> {
    if (!this.art()) {
      console.error('No art');
      return;
    }
    try {
      let lat = position.coords.latitude;
      let lng = position.coords.longitude;
      if (!Capacitor.isNativePlatform()) {
        lat = 40.786958;
        lng = -119.202994;
      }

      await broadcastPost(this.datasetId, this.art()!, lng, lat, this.pin());
      this.apiError.set(false);
      this.setMessage();
    } catch {
      this.wifi.set(false);
      this.apiError.set(true);
      this.setMessage();
    }
  }

  private async keepAwake(awake: boolean): Promise<void> {
    if (awake) {
      this.awake.set(false);
      await KeepAwake.keepAwake();
      this.awake.set(true);
    } else {
      if (this.awake()) {
        await KeepAwake.allowSleep();
        this.awake.set(false);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
    }
    this.position = undefined;
    this.running.set(false);
    this.setMessage();
    await this.keepAwake(false);
  }

  async closePin(correctPIN: boolean): Promise<void> {
    if (correctPIN) {
      this.authenticated.set(true);
      this.settings.set(`mv-pin-${this.art()?.uid}`, this.pin());
      await delay(500);
      this.start();
    } else {
      this.locationR.back();
    }
  }
}
