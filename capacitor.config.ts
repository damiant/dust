import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nexus.concepts.dust',
  appName: 'dust',
  webDir: 'www/browser',
  loggingBehavior: 'none',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#F61067',
      splashFullScreen: false,
      splashImmersive: false,
      launchAutoHide: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'icon',
      iconColor: '#F61067',
      sound: 'blazing2.wav',
    },
    CapacitorUpdater: {
      autoUpdate: false,
      statsUrl: '',
    },
  },
  android: {
    buildOptions: {
      signingType: 'apksigner',
      keystorePath: '../android-keys/Untitled',
      keystoreAlias: 'dust',
    },
  },
};

export default config;
