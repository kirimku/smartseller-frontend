import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e69d948b349d4201911129396c0b5d5e',
  appName: 'GameVault',
  webDir: 'dist',
  server: {
    url: 'https://e69d948b-349d-4201-9111-29396c0b5d5e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F172A',
      showSpinner: false
    }
  }
};

export default config;