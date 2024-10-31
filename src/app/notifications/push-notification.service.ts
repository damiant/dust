import { Injectable } from "@angular/core";
import { PushNotifications } from '@capacitor/push-notifications';

@Injectable({
    providedIn: 'root',
})
export class PushNotificationService {

    public async initialize(): Promise<void> {
        await PushNotifications.addListener('registration', token => {
            console.log('register', token);
        });

        await PushNotifications.addListener('registrationError', err => {
            console.error('registration error', err);
        });

        await PushNotifications.addListener('pushNotificationReceived', notification => {
            console.log('Push notification received: ', notification);
          });
        
          await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
            console.log('Push notification action performed', notification.actionId, notification.inputValue);
          });
    }
    
    public async register(): Promise<boolean> {
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