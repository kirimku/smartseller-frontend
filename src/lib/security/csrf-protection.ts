/**
 * CSRF Protection Module
 * 
 * Provides Cross-Site Request Forgery protection by managing CSRF tokens
 * and automatically adding them to API requests.
 */

export interface CSRFTokenResponse {
  success: boolean;
  data?: {
    csrf_token: string;
    expires_at: string;
  };
  message?: string;
}

export class CSRFProtection {
  private static csrfToken: string | null = null;
  private static tokenExpiry: Date | null = null;
  private static readonly CSRF_TOKEN_KEY = 'csrf_token';
  private static readonly CSRF_EXPIRY_KEY = 'csrf_token_expiry';
  private static isEnabled = true;

  /**
   * Initialize CSRF protection
   */
  static async initialize(): Promise<void> {
    try {
      // Check if CSRF protection is supported by backend
      const response = await fetch('/api/v1/csrf-token', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data: CSRFTokenResponse = await response.json();
        if (data.success && data.data) {
          this.setCSRFToken(data.data.csrf_token, data.data.expires_at);
          console.log('✅ CSRF protection initialized');
        }
      } else {
        console.warn('⚠️ CSRF endpoint not available, protection disabled');
        this.isEnabled = false;
      }
    } catch (error) {
      console.warn('⚠️ CSRF initialization failed:', error);
      this.isEnabled = false;
    }

    // Try to restore from localStorage
    this.restoreFromStorage();
  }

  /**
   * Get current CSRF token, refresh if needed
   */
  static async getCSRFToken(): Promise<string | null> {
    if (!this.isEnabled) {
      return null;
    }

    // Check if current token is valid
    if (this.csrfToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.csrfToken;
    }

    // Token expired or doesn't exist, fetch new one
    return await this.fetchNewCSRFToken();
  }

  /**
   * Fetch a new CSRF token from the server
   */
  static async fetchNewCSRFToken(): Promise<string | null> {
    if (!this.isEnabled) {
      return null;
    }

    try {
      const response = await fetch('/api/v1/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`CSRF token fetch failed: ${response.status}`);
      }

      const data: CSRFTokenResponse = await response.json();
      
      if (data.success && data.data) {
        this.setCSRFToken(data.data.csrf_token, data.data.expires_at);
        return this.csrfToken;
      } else {
        throw new Error(data.message || 'Invalid CSRF token response');
      }
    } catch (error) {
      console.error('❌ Failed to fetch CSRF token:', error);
      return null;
    }
  }

  /**
   * Set CSRF token and expiry
   */
  private static setCSRFToken(token: string, expiresAt: string): void {
    this.csrfToken = token;
    this.tokenExpiry = new Date(expiresAt);
    
    // Store in localStorage for persistence
    localStorage.setItem(this.CSRF_TOKEN_KEY, token);
    localStorage.setItem(this.CSRF_EXPIRY_KEY, expiresAt);
  }

  /**
   * Restore CSRF token from localStorage
   */
  private static restoreFromStorage(): void {
    const token = localStorage.getItem(this.CSRF_TOKEN_KEY);
    const expiry = localStorage.getItem(this.CSRF_EXPIRY_KEY);

    if (token && expiry) {
      const expiryDate = new Date(expiry);
      if (expiryDate > new Date()) {
        this.csrfToken = token;
        this.tokenExpiry = expiryDate;
        console.log('✅ CSRF token restored from storage');
      } else {
        // Token expired, clear storage
        this.clearCSRFToken();
      }
    }
  }

  /**
   * Clear CSRF token
   */
  static clearCSRFToken(): void {
    this.csrfToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem(this.CSRF_TOKEN_KEY);
    localStorage.removeItem(this.CSRF_EXPIRY_KEY);
  }

  /**
   * Add CSRF token to request headers
   */
  static async addCSRFHeader(headers: Record<string, string> = {}): Promise<Record<string, string>> {
    if (!this.isEnabled) {
      return headers;
    }

    const token = await this.getCSRFToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }

    return headers;
  }

  /**
   * Add CSRF token to Axios request config
   */
  static async addCSRFToAxiosConfig(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.isEnabled) {
      return config;
    }

    const token = await this.getCSRFToken();
    if (token) {
      config.headers = (config.headers as Record<string, unknown>) || {};
      (config.headers as Record<string, string>)['X-CSRF-Token'] = token;
    }

    return config;
  }

  /**
   * Validate CSRF token response
   */
  static validateCSRFResponse(response: { status: number; data?: { error?: string } }): boolean {
    if (!this.isEnabled) {
      return true;
    }

    // Check if response indicates CSRF token is invalid
    if (response.status === 403 && 
        response.data?.error === 'csrf_token_invalid') {
      console.warn('⚠️ CSRF token invalid, clearing and will refresh on next request');
      this.clearCSRFToken();
      return false;
    }

    return true;
  }

  /**
   * Check if CSRF protection is enabled
   */
  static isCSRFEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Enable/disable CSRF protection
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearCSRFToken();
    }
  }

  /**
   * Get CSRF token info for debugging
   */
  static getTokenInfo(): { token: string | null; expiry: Date | null; enabled: boolean } {
    return {
      token: this.csrfToken,
      expiry: this.tokenExpiry,
      enabled: this.isEnabled,
    };
  }

  /**
   * Refresh CSRF token manually
   */
  static async refreshToken(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    const token = await this.fetchNewCSRFToken();
    return token !== null;
  }

  /**
   * Create a fetch wrapper with automatic CSRF protection
   */
  static async secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.isEnabled) {
      return fetch(url, options);
    }

    // Determine method and apply CSRF only for mutating requests
    const method = (options.method || 'GET').toUpperCase();

    // Add CSRF token to headers for non-GET/HEAD
    const headers = new Headers(options.headers);
    if (method !== 'GET' && method !== 'HEAD') {
      const token = await this.getCSRFToken();
      if (token) {
        headers.set('X-CSRF-Token', token);
      }
    }

    // Ensure credentials are included for CSRF protection
    const secureOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    const response = await fetch(url, secureOptions);

    // Check if CSRF token was rejected
    if (response.status === 403) {
      const responseData = await response.clone().json().catch(() => ({}));
      if ((responseData as { error?: string }).error === 'csrf_token_invalid') {
        console.warn('⚠️ CSRF token rejected, refreshing and retrying...');
        
        // Clear invalid token and get new one
        this.clearCSRFToken();
        const newToken = await this.fetchNewCSRFToken();
        
        if (newToken && method !== 'GET' && method !== 'HEAD') {
          // Retry request with new token for mutating request
          headers.set('X-CSRF-Token', newToken);
          return fetch(url, { ...secureOptions, headers });
        }
      }
    }

    return response;
  }
}

// Initialize CSRF protection when module loads
CSRFProtection.initialize().catch(console.error);

export default CSRFProtection;