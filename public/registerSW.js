// Enhanced Service Worker Registration for VitePWA
// Simplified version that works with VitePWA's built-in update mechanism

// Check if we're in development mode
const isDevelopmentMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Register the appropriate service worker based on environment
      const swUrl = isDevelopmentMode ? '/dev-sw.js?dev-sw' : '/sw.js';
      const registration = await navigator.serviceWorker.register(swUrl, { 
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('SW registered: ', registration);

      // Let VitePWA handle updates automatically with autoUpdate
      // Just log when updates are found
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New Service Worker installed and ready');
              // VitePWA will handle the update automatically due to autoUpdate + skipWaiting
            }
          });
        }
      });

      // Check for updates immediately and periodically
      registration.update();
      
      // Check for updates every 30 seconds in development, 5 minutes in production
      const updateInterval = isDevelopmentMode ? 30000 : 300000;
      setInterval(() => {
        registration.update();
      }, updateInterval);

    } catch (error) {
      console.log('SW registration failed: ', error);
    }
  });
}

// Build version tracking (for debugging)
window.__APP_VERSION__ = '__BUILD_VERSION__';
window.__BUILD_TIMESTAMP__ = '__BUILD_TIMESTAMP__';

// Simple version logging for debugging
if (isDevelopmentMode) {
  console.log('🔧 Development mode - Service Worker registered for:', window.location.hostname);
  console.log('📦 App Version:', window.__APP_VERSION__);
  console.log('🕒 Build Time:', window.__BUILD_TIMESTAMP__);
} else {
  console.log('🚀 Production mode - PWA ready');
}