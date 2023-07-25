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
      backgroundColor: '#F61067',
      splashFullScreen: true,
      splashImmersive: false,
      launchAutoHide: false,
    }
  },
};

export default config;
