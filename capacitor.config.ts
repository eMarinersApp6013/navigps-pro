import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.emarinersapp.navigpspro',
  appName: 'SeaGPS Pro',
  webDir: 'www',

  // Server config — loads from local files (no remote server)
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    allowNavigation: ['*']
  },

  // Plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a1628',
      androidSplashResourceName: 'splash',
      showSpinner: true,
      spinnerColor: '#00e676'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a1628'
    },
    ScreenOrientation: {
      // Allow both portrait and landscape
    },
    KeepAwake: {
      // Keep screen on during navigation watch
    }
  },

  // Android-specific config
  android: {
    allowMixedContent: true,
    backgroundColor: '#0a1628',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  },

  // iOS-specific config
  ios: {
    backgroundColor: '#0a1628',
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'SeaGPS Pro'
  }
};

export default config;
