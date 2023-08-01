import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ionic.ttitd',
  appName: 'ttitd',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#f61067',
      splashFullScreen: false,
      splashImmersive: false,
      launchAutoHide: false,
    }
  },
  android: {
    buildOptions: {
      keystorePath: './ttitd/android-keys/Untitled',
      keystoreAlias: 'dust',
    }
  }
};

export default config;
