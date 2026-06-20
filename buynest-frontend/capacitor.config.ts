import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.buynest.app',
  appName: 'BuyNest',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
