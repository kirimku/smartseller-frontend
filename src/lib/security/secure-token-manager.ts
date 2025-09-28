/**
 * Secure Token Manager
 * 
 * This class provides secure token management using httpOnly cookies
 * instead of localStorage to prevent XSS attacks.
 * 
 * Note: This implementation requires backend support for:
 * - Setting httpOnly cookies for tokens
 * - CSRF token endpoint
 * - Cookie-based authentication
 */

export interface TokenInfo {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  csrfToken?: string;
}

export interface SecureTokenResponse {
  success: boolean;
  message?: string;
  data?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    csrf_token?: string;
  };
}

export class SecureTokenManager {
  private static readonly CSRF_TOKEN_KEY = 'csrf_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private static readonly AUTH_STATUS_KEY = 'auth_status';
  
  // Fallback storage for development/transition period
  private static readonly FALLBACK_ACCESS_TOKEN_KEY = 'smartseller_access_token';
  private static readonly FALLBACK_REFRESH_TOKEN_KEY = 'smartseller_refresh_token';
  
  private static csrfToken: string | null = null;
  private static isSecureModeEnabled = false;

  /**
   * Initialize secure token manager
   * Checks if secure mode (httpOnly cookies) is available
   */
  static async initialize(): Promise<void> {
    try {
      // Check if backend supports secure token management
      const response = await fetch('/api/v1/auth/secure-check', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        this.isSecureModeEnabled = true;
        console.log('✅ Secure token management enabled (httpOnly cookies)');
      } else {
        this.isSecureModeEnabled = false;
        console.warn('⚠️ Falling back to localStorage token storage');
      }
    } catch (error) {
      this.isSecureModeEnabled = false;
      console.warn('⚠️ Secure mode check failed, using localStorage fallback');
    }
  }

  /**
   * Set authentication tokens securely
   */
  static async setTokens(
    accessToken: string, 
    refreshToken: string, 
    expiresIn: number,
    csrfToken?: string
  ): Promise<void> {
    const expiryDate = new Date(Date.now() + expiresIn * 1000);
    
    if (this.isSecureModeEnabled) {
      try {
        // Send tokens to backend to set as httpOnly cookies
        const response = await fetch('/api/v1/auth/set-secure-tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: expiresIn,
            csrf_token: csrfToken,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to set secure tokens');
        }

        // Store CSRF token and expiry in localStorage (safe for these)
        if (csrfToken) {
          localStorage.setItem(this.CSRF_TOKEN_KEY, csrfToken);
          this.csrfToken = csrfToken;
        }
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryDate.toISOString());
        localStorage.setItem(this.AUTH_STATUS_KEY, 'authenticated');
        
        console.log('✅ Tokens set securely via httpOnly cookies');
      } catch (error) {
        console.error('❌ Failed to set secure tokens, falling back to localStorage');
        this.setTokensFallback(accessToken, refreshToken, expiryDate);
      }
    } else {
      // Fallback to localStorage
      this.setTokensFallback(accessToken, refreshToken, expiryDate);
    }
  }

  /**
   * Get access token (for secure mode, this returns null as token is in httpOnly cookie)
   */
  static getAccessToken(): string | null {
    if (this.isSecureModeEnabled) {
      // In secure mode, access token is in httpOnly cookie
      // Backend will automatically include it in requests
      return null;
    } else {
      // Fallback mode
      return localStorage.getItem(this.FALLBACK_ACCESS_TOKEN_KEY);
    }
  }

  /**
   * Get refresh token (for secure mode, this returns null as token is in httpOnly cookie)
   */
  static getRefreshToken(): string | null {
    if (this.isSecureModeEnabled) {
      // In secure mode, refresh token is in httpOnly cookie
      return null;
    } else {
      // Fallback mode
      return localStorage.getItem(this.FALLBACK_REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Get CSRF token for request headers
   */
  static getCSRFToken(): string | null {
    if (this.csrfToken) {
      return this.csrfToken;
    }
    return localStorage.getItem(this.CSRF_TOKEN_KEY);
  }

  /**
   * Get token expiry date
   */
  static getTokenExpiry(): Date | null {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? new Date(expiry) : null;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    if (this.isSecureModeEnabled) {
      // In secure mode, check auth status flag and expiry
      const authStatus = localStorage.getItem(this.AUTH_STATUS_KEY);
      const expiry = this.getTokenExpiry();
      
      return authStatus === 'authenticated' && 
             expiry !== null && 
             expiry > new Date();
    } else {
      // Fallback mode - check localStorage tokens
      const accessToken = this.getAccessToken();
      return accessToken !== null && !this.isTokenExpired();
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    return expiry ? expiry <= new Date() : true;
  }

  /**
   * Clear all authentication data
   */
  static async clearTokens(): Promise<void> {
    if (this.isSecureModeEnabled) {
      try {
        // Clear httpOnly cookies via backend
        await fetch('/api/v1/auth/clear-secure-tokens', {
          method: 'POST',
          credentials: 'include',
        });
        console.log('✅ Secure tokens cleared');
      } catch (error) {
        console.error('❌ Failed to clear secure tokens:', error);
      }
    }

    // Clear localStorage data (both secure and fallback modes)
    localStorage.removeItem(this.CSRF_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.AUTH_STATUS_KEY);
    
    // Clear fallback tokens
    localStorage.removeItem(this.FALLBACK_ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.FALLBACK_REFRESH_TOKEN_KEY);
    
    this.csrfToken = null;
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  /**
   * Refresh tokens using secure method
   */
  static async refreshTokens(): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: this.isSecureModeEnabled ? {
          'X-CSRF-Token': this.getCSRFToken() || '',
        } : {
          'Authorization': `Bearer ${this.getRefreshToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data: SecureTokenResponse = await response.json();
      
      if (data.success && data.data) {
        await this.setTokens(
          data.data.access_token,
          data.data.refresh_token,
          data.data.expires_in,
          data.data.csrf_token
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      await this.clearTokens();
      return false;
    }
  }

  /**
   * Get authentication headers for API requests
   */
  static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.isSecureModeEnabled) {
      // In secure mode, add CSRF token
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    } else {
      // In fallback mode, add Authorization header
      const accessToken = this.getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }
    
    return headers;
  }

  /**
   * Check if secure mode is enabled
   */
  static isSecureMode(): boolean {
    return this.isSecureModeEnabled;
  }

  /**
   * Fallback method for localStorage token storage
   */
  private static setTokensFallback(
    accessToken: string, 
    refreshToken: string, 
    expiryDate: Date
  ): void {
    localStorage.setItem(this.FALLBACK_ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.FALLBACK_REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryDate.toISOString());
    localStorage.setItem(this.AUTH_STATUS_KEY, 'authenticated');
  }

  /**
   * Migrate from old TokenManager to SecureTokenManager
   */
  static migrateFromLegacyTokens(): void {
    const oldAccessToken = localStorage.getItem('smartseller_access_token');
    const oldRefreshToken = localStorage.getItem('smartseller_refresh_token');
    const oldExpiry = localStorage.getItem('smartseller_token_expiry');

    if (oldAccessToken && oldRefreshToken && oldExpiry) {
      console.log('🔄 Migrating from legacy token storage...');
      
      // Copy to new fallback keys
      localStorage.setItem(this.FALLBACK_ACCESS_TOKEN_KEY, oldAccessToken);
      localStorage.setItem(this.FALLBACK_REFRESH_TOKEN_KEY, oldRefreshToken);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, oldExpiry);
      localStorage.setItem(this.AUTH_STATUS_KEY, 'authenticated');
      
      // Remove old keys
      localStorage.removeItem('smartseller_access_token');
      localStorage.removeItem('smartseller_refresh_token');
      localStorage.removeItem('smartseller_token_expiry');
      
      console.log('✅ Legacy tokens migrated successfully');
    }
  }
}

// Initialize secure token manager when module loads
SecureTokenManager.initialize().catch(console.error);

// Migrate legacy tokens if they exist
SecureTokenManager.migrateFromLegacyTokens();

export default SecureTokenManager;