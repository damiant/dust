import { Injectable } from '@angular/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

interface GPSPin {
  lat: number;
  long: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {

  constructor() { }

  async openAppleMap(pin: GPSPin) {
    if (await this.canOpenMapApp('apple')) {
      // Apple seems to always return true when checking URL for Apple Maps...regardless if the app is actually installed
      // https://stackoverflow.com/questions/39603120/how-to-check-if-apple-maps-is-installed
      try {
        const { completed } = await AppLauncher.openUrl({ url: this.generateLaunchURL('apple', 'pin', pin) });
        
        // The completed result will be false if there was an issue or if app was missing (fails before user answers prompt to restore app from App Store)
        // In the case the user was missing the app, they'll need to return to your application to relaunch the URL after installing Apple Maps
        if (!completed) {
          throw new Error('Failed to open Apple Maps!');
        }
      } catch (e) {
        console.error((e as Error).message);
      }
    } else {
      console.warn('Can not open Apple Maps!');
    }
  }

  private asString(pin: GPSPin): string {
    return `${pin.lat},${pin.long}`;
  }

  async openAppleMapDirections(pin: GPSPin) {
    if (await this.canOpenMapApp('apple')) {
      try {
        const { completed } = await AppLauncher.openUrl({ url: this.generateLaunchURL('apple', 'directions', pin) });
        
        if (!completed) {
          throw new Error('Failed to open Apple Maps!');
        }
      } catch (e) {
        console.error((e as Error).message);
      }
    } else {
      console.warn('Can not open Apple Maps!');
    }
  }

  async openGoogleMap(pin: GPSPin) {
    // No need to rely on check if we can open, since Google recommends this universal link over platform specific URL schemes
    // Recommendation: https://developers.google.com/maps/documentation/urls/ios-urlscheme
    const canOpen = await this.canOpenMapApp('google');
    console.log(`Google Maps will open in the ${canOpen ? 'installed application' : 'browser'}`);
    
    try {
      const { completed } = await AppLauncher.openUrl({ url: this.generateLaunchURL('google', 'pin', pin) });
      
      // The completed result will be false if there was an issue
      if (!completed) {
        throw new Error('Failed to open Google Maps!');
      }
    } catch (e) {
      console.error((e as Error).message);
    }
  }

  async openGoogleMapDirections (pin: GPSPin) {
    // We want turn-by-turn directions, so need to rely on check if we can open
    const canOpen = await this.canOpenMapApp('google');
    
    if (canOpen) {
      try {
        // By trying to launch the native application, iOS will prompt the user to allow it
        const { completed } = await AppLauncher.openUrl({ url: this.generateLaunchURL('google', 'directions', pin) });

        // The completed result will be false if there was an issue
        if (!completed) {
          throw new Error('Failed to open Google Maps!');
        }
      } catch (e) {
        console.error((e as Error).message);
      }
    } else {
      console.warn('Can not open Google Maps!');
    }
  }

  public async canOpenMapApp (targetApp: 'google'|'apple') {
    switch(targetApp) {
      case 'apple': {
        if (!this.isIOS()) {
          return false;
        }
        const { value } = await AppLauncher.canOpenUrl({ url: 'maps://' });
        console.log('Can open url: ', value);
        return value;
      }

      case 'google': {
        const { value } = await AppLauncher.canOpenUrl({ url: this.isIOS() ? 'comgooglemaps://' : 'com.google.android.apps.maps' });
        console.log('Can open url: ', value);
        return value;
      }
    }
  }

  private isIOS(): boolean {
    return (Capacitor.getPlatform() == 'ios');
  }

  private generateLaunchURL(targetApp: 'google'|'apple', mapType: 'pin'|'directions', pin: GPSPin) {
    switch(targetApp) {
      // Documentation: https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html
      case 'apple': {
        if (!this.isIOS()) {
          throw new Error('Apple Maps can only be used on iOS!');
        }

        if (mapType === 'pin') {
          // The params q and ll must be use together to drop a pin at a specific lat/long
          const urlEncodedParams = new URLSearchParams();
          urlEncodedParams.append('q', 'My Test Pin');
          return `maps://?ll=${this.asString(pin)}&${urlEncodedParams.toString()}`;
        } else {
          // The param daddr is required for the destination location, if saddr is missing defaults to current location as starting point
          return `maps://?dirflg=t&daddr=${this.asString(pin)}`;
        }
      }

      // Documentation: https://developers.google.com/maps/documentation/urls/get-started
      case 'google': {
        if (mapType === 'pin') {
          const launchUrl = new URL('https://www.google.com/maps/search/?api=1');
          launchUrl.searchParams.append('query', this.asString(pin));
          return launchUrl.href;
        } else {
          if (this.isIOS()) {
            // https://developers.google.com/maps/documentation/urls/ios-urlscheme#directions
            return `comgooglemaps://?directionsmode=driving&daddr=${this.asString(pin)}`;
          }
          // https://developers.google.com/maps/documentation/urls/android-intents
          return `google.navigation:mode=d&q=${this.asString(pin)}`;
        }
      }
    }
  }
}
