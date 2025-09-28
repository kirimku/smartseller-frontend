// Enhanced Service Worker Registration with Aggressive Update Handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js', { 
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('SW registered: ', registration);

      // Check for updates immediately
      registration.update();

      // Check for updates every 30 seconds
      setInterval(() => {
        registration.update();
      }, 30000);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('New service worker found, installing...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              console.log('New content is available; please refresh.');
              
              // Show update notification to user
              showUpdateNotification();
            } else {
              // Content is cached for the first time
              console.log('Content is cached for offline use.');
            }
          }
        });
      });

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed, reloading page...');
        window.location.reload();
      });

    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError);
    }
  });

  // Function to show update notification
  function showUpdateNotification() {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.id = 'sw-update-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4f46e5;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 300px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">Update Available</div>
      <div style="opacity: 0.9;">Click to refresh and get the latest version</div>
    `;

    notification.addEventListener('click', () => {
      window.location.reload();
    });

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  // Force refresh if page is loaded from cache and there's a newer version
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      // Page was loaded from cache, check for updates
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
      }
    }
  });
}

// Add version checking mechanism
window.__APP_VERSION__ = '__BUILD_VERSION__';
window.__BUILD_TIMESTAMP__ = '__BUILD_TIMESTAMP__';

// Check if we're in development mode
const isDevelopmentMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Skip version checking in development mode to prevent infinite loops
if (!isDevelopmentMode) {
  // Check if we have a cached version and if it's different
  const cachedVersion = localStorage.getItem('app_version');
  const currentVersion = window.__APP_VERSION__;
  
  // Check if we recently reloaded to prevent infinite loops
  const reloadFlag = sessionStorage.getItem('sw_reload_flag');
  const hasRecentlyReloaded = reloadFlag && (Date.now() - parseInt(reloadFlag, 10)) < 5000;

  if (cachedVersion && cachedVersion !== currentVersion && !hasRecentlyReloaded) {
    console.log('App version changed, clearing caches...');
    
    // Set reload flag to prevent infinite loops
    sessionStorage.setItem('sw_reload_flag', Date.now().toString());
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear localStorage version tracking
    localStorage.removeItem('app_version');
    
    // Force reload to get fresh content
    window.location.reload(true);
  }

  // Store current version
  localStorage.setItem('app_version', currentVersion);
} else {
  console.log('Version checking disabled in development mode');
}