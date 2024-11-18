import { inject, Injectable, signal } from "@angular/core";
import { PushNotifications } from '@capacitor/push-notifications';
import { ApiService } from "../data/api.service";
import { Capacitor } from "@capacitor/core";
import { SettingsService } from "../data/settings.service";
import { Router } from "@angular/router";

@Injectable({
    providedIn: 'root',
})
export class PushNotificationService {
    pushToken = '';
    public enabled = signal(false);
    private api = inject(ApiService);
    private router = inject(Router);
    private settings = inject(SettingsService);
    private datasetId = '';

    public async initialize(datasetId: string): Promise<void> {
        this.datasetId = datasetId;
        this.enabled.set(await this.getNotificationsEnabled());
        if (Capacitor.getPlatform() == 'web') return;
        await PushNotifications.removeAllListeners();
        await PushNotifications.addListener('registration', async token => {
            this.pushToken = token.value;
            if (await this.getNotificationsEnabledOrUndefined() == false) {
                // Don't auto subscribe if the user has unsubscribed
                return;
            }
            const registered = await this.api.registerToken(token.value, datasetId);
            if (registered) {
                await this.storeNotifications(true);
                console.log(`Token ${token.value} registered for ${datasetId}`);
            }
        });

        await PushNotifications.addListener('registrationError', err => {
            console.error('registration error', err);
        });

        await PushNotifications.addListener('pushNotificationReceived', notification => {
            console.log('Push notification received: ', notification);
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
            console.log('Push notification action performed', notification.actionId, notification.inputValue);
            this.router.navigateByUrl('/messages');
        });
    }

    public async storeNotifications(enabled?: boolean): Promise<boolean> {
        if (enabled == undefined) {
            enabled = await this.getNotificationsEnabled();
        }

        if (!enabled) {
            const result = await this.api.unregisterToken(this.pushToken, this.datasetId);
            if (result) {
                console.log(`Unregistered token for ${this.datasetId}`);
            }
        } else {
            if (!this.pushToken) {
                console.error(`Unable to subscribe as no push notification is set`);
                return false;
            }
            await this.api.registerToken(this.pushToken, this.datasetId);
        }
        await this.settings.setBoolean(this.settings.settings.datasetId + '.notifications', enabled);
        this.enabled.set(await this.getNotificationsEnabled());
        return enabled;
    }

    public async getNotificationsEnabled(): Promise<boolean> {
        return await this.settings.getBoolean(this.settings.settings.datasetId + '.notifications');
    }

    public async getNotificationsEnabledOrUndefined(): Promise<boolean | undefined> {
        const key = this.settings.settings.datasetId + '.notifications';
        if (!await this.settings.hasValue(key)) {
            return undefined;
        }
        return await this.settings.getBoolean(key);
    }

    public async register(): Promise<boolean> {
        if (Capacitor.getPlatform() == 'web') return false;
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive == 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') {
            return false;
        }
        await PushNotifications.register();
        return true;
    }
}