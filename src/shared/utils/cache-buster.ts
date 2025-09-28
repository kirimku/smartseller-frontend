// Cache Busting Utilities
export class CacheBuster {
  private static readonly VERSION_KEY = 'app_version';
  private static readonly TIMESTAMP_KEY = 'app_timestamp';
  private static readonly RELOAD_FLAG_KEY = 'cache_buster_reload_flag';
  private static readonly RELOAD_COOLDOWN = 5000; // 5 seconds cooldown

  /**
   * Get the current app version from build-time constants
   */
  static getCurrentVersion(): string {
    return (window as unknown as { __BUILD_VERSION__?: string }).__BUILD_VERSION__ || 'unknown';
  }

  /**
   * Get the current build timestamp
   */
  static getCurrentTimestamp(): string {
    return (window as unknown as { __BUILD_TIMESTAMP__?: string }).__BUILD_TIMESTAMP__ || new Date().toISOString();
  }

  /**
   * Check if the app version has changed since last visit
   */
  static hasVersionChanged(): boolean {
    const currentVersion = this.getCurrentVersion();
    const storedVersion = localStorage.getItem(this.VERSION_KEY);
    
    return storedVersion !== null && storedVersion !== currentVersion;
  }

  /**
   * Check if we're in development mode
   */
  static isDevelopmentMode(): boolean {
    return import.meta.env.DEV || window.location.hostname === 'localhost';
  }

  /**
   * Check if we recently reloaded to prevent infinite loops
   */
  static hasRecentlyReloaded(): boolean {
    const reloadFlag = sessionStorage.getItem(this.RELOAD_FLAG_KEY);
    if (!reloadFlag) return false;
    
    const reloadTime = parseInt(reloadFlag, 10);
    const now = Date.now();
    
    return (now - reloadTime) < this.RELOAD_COOLDOWN;
  }

  /**
   * Set reload flag to prevent infinite loops
   */
  static setReloadFlag(): void {
    sessionStorage.setItem(this.RELOAD_FLAG_KEY, Date.now().toString());
  }

  /**
   * Update stored version to current version
   */
  static updateStoredVersion(): void {
    localStorage.setItem(this.VERSION_KEY, this.getCurrentVersion());
    localStorage.setItem(this.TIMESTAMP_KEY, this.getCurrentTimestamp());
  }

  /**
   * Clear all application caches
   */
  static async clearAllCaches(): Promise<void> {
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches cleared');
      }

      // Clear localStorage (except essential items)
      const essentialKeys = ['theme', 'language', 'user-preferences'];
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !essentialKeys.includes(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear sessionStorage
      sessionStorage.clear();

      console.log('Application caches cleared');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }

  /**
   * Force reload the application with cache bypass
   */
  static forceReload(): void {
    // Try different methods to ensure cache bypass
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // Force reload with cache bypass
    window.location.reload();
  }

  /**
   * Check for updates and handle version changes
   */
  static async checkForUpdates(): Promise<boolean> {
    try {
      // Fetch the current index.html with cache bypass
      const response = await fetch('/', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch latest version');
      }

      const html = await response.text();
      
      // Extract version from meta tag
      const versionMatch = html.match(/<meta name="app-version" content="([^"]+)"/);
      const latestVersion = versionMatch ? versionMatch[1] : null;
      
      if (latestVersion && latestVersion !== this.getCurrentVersion()) {
        console.log('New version detected:', latestVersion);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  /**
   * Initialize cache busting on app start
   */
  static initialize(): void {
    // Skip cache busting in development mode to prevent infinite loops
    if (this.isDevelopmentMode()) {
      console.log('Cache busting disabled in development mode');
      return;
    }

    // Check if we recently reloaded to prevent infinite loops
    if (this.hasRecentlyReloaded()) {
      console.log('Recently reloaded, skipping cache busting check');
      return;
    }

    // Check if version changed on app start
    if (this.hasVersionChanged()) {
      console.log('Version change detected, clearing caches...');
      this.setReloadFlag(); // Set flag before reloading
      this.clearAllCaches().then(() => {
        this.updateStoredVersion();
        this.forceReload();
      });
      return;
    }

    // Update stored version if not set
    if (!localStorage.getItem(this.VERSION_KEY)) {
      this.updateStoredVersion();
    }

    // Set up periodic update checks (every 5 minutes) - only in production
    setInterval(async () => {
      const hasUpdate = await this.checkForUpdates();
      if (hasUpdate) {
        this.showUpdateNotification();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Show update notification to user
   */
  private static showUpdateNotification(): void {
    // Check if notification already exists
    if (document.getElementById('cache-buster-notification')) {
      return;
    }

    const notification = document.createElement('div');
    notification.id = 'cache-buster-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 320px;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">🚀</div>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">New Version Available!</div>
          <div style="opacity: 0.9; font-size: 13px;">Click to update to the latest version</div>
        </div>
      </div>
    `;

    notification.addEventListener('click', () => {
      this.clearAllCaches().then(() => {
        this.forceReload();
      });
    });

    // Add hover effect
    notification.addEventListener('mouseenter', () => {
      notification.style.transform = 'translateY(-2px)';
      notification.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
    });

    notification.addEventListener('mouseleave', () => {
      notification.style.transform = 'translateY(0)';
      notification.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
    });

    document.body.appendChild(notification);

    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      }
    }, 15000);
  }
}

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  CacheBuster.initialize();
}