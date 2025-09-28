// PWA Cache Manager for VitePWA
// Handles service worker updates and cache management

export class PWACacheManager {
  private static readonly UPDATE_CHECK_INTERVAL = 30000; // 30 seconds
  private static readonly FORCE_UPDATE_KEY = 'pwa_force_update';
  private static readonly LAST_UPDATE_CHECK = 'pwa_last_update_check';
  private static readonly UPDATE_COOLDOWN = 10000; // 10 seconds

  /**
   * Initialize PWA cache management
   */
  static initialize(): void {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    // Set up service worker event listeners
    this.setupServiceWorkerListeners();
    
    // Start periodic update checks
    this.startUpdateChecks();
    
    // Handle page visibility changes
    this.handleVisibilityChange();
  }

  /**
   * Set up service worker event listeners
   */
  private static setupServiceWorkerListeners(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
        console.log('🔄 Service Worker update available');
        this.showUpdateNotification();
      }
    });

    // Listen for service worker registration updates
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New Service Worker installed, update available');
              this.showUpdateNotification();
            }
          });
        }
      });
    });
  }

  /**
   * Start periodic update checks
   */
  private static startUpdateChecks(): void {
    // Check immediately
    this.checkForUpdates();
    
    // Set up interval for periodic checks
    setInterval(() => {
      this.checkForUpdates();
    }, this.UPDATE_CHECK_INTERVAL);
  }

  /**
   * Check for service worker updates
   */
  static async checkForUpdates(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('🔍 Checked for Service Worker updates');
        localStorage.setItem(this.LAST_UPDATE_CHECK, Date.now().toString());
      }
    } catch (error) {
      console.error('❌ Error checking for updates:', error);
    }
  }

  /**
   * Force update the service worker and reload
   */
  static async forceUpdate(): Promise<void> {
    try {
      console.log('🔄 Forcing PWA update...');
      
      // Clear all caches
      await this.clearAllCaches();
      
      // Unregister current service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🗑️ Unregistered service worker');
      }
      
      // Set force update flag
      localStorage.setItem(this.FORCE_UPDATE_KEY, Date.now().toString());
      
      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error('❌ Error forcing update:', error);
      // Fallback: just reload
      window.location.reload();
    }
  }

  /**
   * Clear all application caches
   */
  static async clearAllCaches(): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('🗑️ Clearing caches:', cacheNames);
        
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        
        console.log('✅ All caches cleared');
      }
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
    }
  }

  /**
   * Show update notification to user
   */
  private static showUpdateNotification(): void {
    // Check if notification already exists
    if (document.getElementById('pwa-update-notification')) {
      return;
    }

    // Check cooldown
    const lastCheck = localStorage.getItem(this.LAST_UPDATE_CHECK);
    if (lastCheck && (Date.now() - parseInt(lastCheck, 10)) < this.UPDATE_COOLDOWN) {
      return;
    }

    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="margin-bottom: 12px;">
        <strong>🚀 App Update Available</strong>
      </div>
      <div style="margin-bottom: 16px; opacity: 0.9;">
        A new version is ready. Update now for the latest features and improvements.
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="pwa-update-btn" style="
          background: white;
          color: #3b82f6;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          font-size: 12px;
        ">Update Now</button>
        <button id="pwa-dismiss-btn" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Later</button>
      </div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Add event listeners
    document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
      this.forceUpdate();
    });

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      notification.remove();
      localStorage.setItem(this.LAST_UPDATE_CHECK, Date.now().toString());
    });

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 30000);
  }

  /**
   * Handle page visibility changes to check for updates
   */
  private static handleVisibilityChange(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible, check for updates
        setTimeout(() => {
          this.checkForUpdates();
        }, 1000);
      }
    });
  }

  /**
   * Check if we should force update on page load
   */
  static checkForceUpdate(): boolean {
    const forceUpdate = localStorage.getItem(this.FORCE_UPDATE_KEY);
    if (forceUpdate) {
      localStorage.removeItem(this.FORCE_UPDATE_KEY);
      return true;
    }
    return false;
  }

  /**
   * Get cache status information
   */
  static async getCacheStatus(): Promise<{
    cacheNames: string[];
    totalCaches: number;
    serviceWorkerStatus: string;
  }> {
    const cacheNames = 'caches' in window ? await caches.keys() : [];
    const registration = await navigator.serviceWorker.getRegistration();
    
    let serviceWorkerStatus = 'not-registered';
    if (registration) {
      if (registration.active) {
        serviceWorkerStatus = 'active';
      } else if (registration.installing) {
        serviceWorkerStatus = 'installing';
      } else if (registration.waiting) {
        serviceWorkerStatus = 'waiting';
      }
    }

    return {
      cacheNames,
      totalCaches: cacheNames.length,
      serviceWorkerStatus
    };
  }
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      PWACacheManager.initialize();
    });
  } else {
    PWACacheManager.initialize();
  }
}