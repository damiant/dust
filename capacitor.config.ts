import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ionic.ttitd',
  appName: 'ttitd',
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
    LocalNotifications: {
      smallIcon: 'icon',
      iconColor: '#F61067',
      sound: 'blazing2.wav',
    },
    CapacitorUpdater: {
      autoUpdate: false,
      statsUrl: "",
    }
  },
  android: {
    buildOptions: {
      keystorePath: '../android-keys/Untitled',
      keystoreAlias: 'dust',
    },
  },
};

export default config;
