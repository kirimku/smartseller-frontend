/**
 * Enhanced API Client with Secure Token Management and CSRF Protection
 * 
 * This module extends the existing API client with:
 * - Secure token storage using httpOnly cookies
 * - CSRF protection for all requests
 * - Enhanced token refresh mechanism
 * - Automatic migration from legacy localStorage tokens
 */

import { createClient, createConfig } from '../../generated/api/client';
import type { Client, ClientOptions } from '../../generated/api/client';
import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { SecureTokenManager } from './secure-token-manager';
import { CSRFProtection } from './csrf-protection';

const API_BASE_URL = import.meta.env.VITE_BACKEND_HOST || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _csrfRetry?: boolean;
}

export interface TokenRefreshResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    token_expiry: string;
  };
  message?: string;
}

export interface ApiError {
  success: boolean;
  message: string;
  error?: string;
  meta?: {
    http_status: number;
  };
}

/**
 * Enhanced API Client Class
 */
export class EnhancedApiClient {
  private client: Client;
  private isInitialized = false;
  private refreshPromise: Promise<boolean> | null = null;
  private isHandlingAuthFailure = false;

  constructor() {
    this.client = createClient(createConfig<ClientOptions>({
      baseURL: API_BASE_URL,
    }));

    this.setupInterceptors();
  }

  /**
   * Initialize the enhanced API client
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize secure token manager and CSRF protection
      await Promise.all([
        SecureTokenManager.initialize(),
        CSRFProtection.initialize(),
      ]);

      console.log('✅ Enhanced API client initialized');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize enhanced API client:', error);
      throw error;
    }
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.instance.interceptors.request.use(
      async (config) => {
        // Add authentication token
        const token = await SecureTokenManager.getAccessToken();
        if (token && !SecureTokenManager.isTokenExpired()) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }

        // Add CSRF protection
        const csrfHeaders = await CSRFProtection.addCSRFHeader();
        Object.entries(csrfHeaders).forEach(([key, value]) => {
          config.headers.set(key, value);
        });

        // Ensure credentials are included for secure cookies
        config.withCredentials = true;

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Validate CSRF response
        CSRFProtection.validateCSRFResponse(response);
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        // Handle CSRF token errors
        if (error.response?.status === 403 && 
            error.response.data && 
            typeof error.response.data === 'object' &&
            'error' in error.response.data &&
            error.response.data.error === 'csrf_token_invalid' &&
            originalRequest && 
            !originalRequest._csrfRetry) {
          
          originalRequest._csrfRetry = true;
          
          // Refresh CSRF token and retry
          const csrfRefreshed = await CSRFProtection.refreshToken();
          if (csrfRefreshed) {
            const csrfHeaders = await CSRFProtection.addCSRFHeader();
            Object.entries(csrfHeaders).forEach(([key, value]) => {
              originalRequest.headers.set(key, value);
            });
            return this.client.instance.request(originalRequest);
          }
        }

        // Handle authentication errors
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          // Skip auth failure handling for logout endpoints to prevent infinite loops
          const isLogoutEndpoint = originalRequest.url?.includes('/auth/logout');
          
          if (isLogoutEndpoint) {
            console.log('🔐 Logout endpoint returned 401, skipping auth failure handling');
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          try {
            const refreshed = await this.refreshTokens();
            
            if (refreshed) {
              // Retry the original request with new token
              const newToken = await SecureTokenManager.getAccessToken();
              if (newToken) {
                originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
                return this.client.instance.request(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }

          // If refresh fails, handle logout
          await this.handleAuthFailure('token_expired');
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh authentication tokens
   */
  private async refreshTokens(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = await SecureTokenManager.getRefreshToken();
      
      if (!refreshToken) {
        console.warn('⚠️ No refresh token available');
        return false;
      }

      // Create a temporary client for refresh request to avoid interceptor loops
      const refreshClient = createClient(createConfig<ClientOptions>({
        baseURL: API_BASE_URL,
      }));

      const response = await refreshClient.post({
        url: '/api/v1/auth/refresh',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          ...(await CSRFProtection.addCSRFHeader()),
        },
      });

      const responseData = response.data as TokenRefreshResponse;
      
      if (responseData.success && responseData.data) {
        const { access_token, refresh_token, token_expiry } = responseData.data;
        
        // Convert token_expiry string to expiresIn seconds
        let expiresIn = 3600; // Default to 1 hour
        if (token_expiry) {
          try {
            const expiryDate = new Date(token_expiry);
            const now = new Date();
            expiresIn = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / 1000));
          } catch (error) {
            console.warn('Failed to parse token_expiry, using default:', error);
          }
        }
        
        await SecureTokenManager.setTokens(access_token, refresh_token, expiresIn);
        
        console.log('✅ Tokens refreshed successfully');
        return true;
      } else {
        console.warn('⚠️ Token refresh response invalid:', responseData);
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Handle authentication failure
   */
  private async handleAuthFailure(reason: string): Promise<void> {
    // Prevent recursive calls
    if (this.isHandlingAuthFailure) {
      console.log(`🔐 Already handling auth failure, skipping: ${reason}`);
      return;
    }

    this.isHandlingAuthFailure = true;

    try {
      // Clear all tokens and auth data
      await SecureTokenManager.clearTokens();
      CSRFProtection.clearCSRFToken();

      // Only dispatch event for token expiration, not for user-initiated logout
      if (reason === 'token_expired') {
        window.dispatchEvent(new CustomEvent('auth:logout', { 
          detail: { reason } 
        }));
      }

      console.log(`🔐 Authentication failure handled: ${reason}`);
    } finally {
      // Reset the flag after a short delay to allow for cleanup
      setTimeout(() => {
        this.isHandlingAuthFailure = false;
      }, 100);
    }
  }

  /**
   * Login with credentials
   */
  async login(credentials: { email_or_phone: string; password: string }): Promise<boolean> {
    try {
      const response = await this.client.post({
        url: '/api/v1/auth/login',
        body: {
          email_or_phone: credentials.email_or_phone,
          password: credentials.password,
          use_secure_tokens: window.location.protocol === 'https:'
        },
        headers: await CSRFProtection.addCSRFHeader(),
      });

      const responseData = response.data as TokenRefreshResponse;
      
      if (responseData.success && responseData.data) {
        const { access_token, refresh_token, token_expiry } = responseData.data;
        
        // Convert token_expiry string to expiresIn seconds
        let expiresIn = 3600; // Default to 1 hour
        if (token_expiry) {
          try {
            const expiryDate = new Date(token_expiry);
            const now = new Date();
            expiresIn = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / 1000));
          } catch (error) {
            console.warn('Failed to parse token_expiry, using default:', error);
          }
        }
        
        await SecureTokenManager.setTokens(access_token, refresh_token, expiresIn);
        
        // Dispatch login success event
        window.dispatchEvent(new CustomEvent('auth:login', { 
          detail: { success: true } 
        }));

        console.log('✅ Login successful');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Login failed:', error);
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      await this.client.post({
        url: '/api/v1/auth/logout',
        headers: await CSRFProtection.addCSRFHeader(),
      }).catch(() => {
        // Ignore logout endpoint errors - this is expected if user is already logged out
        console.warn('⚠️ Logout endpoint not available or failed');
      });
    } finally {
      // Always clear local tokens directly without triggering auth failure handling
      await SecureTokenManager.clearTokens();
      CSRFProtection.clearCSRFToken();
      console.log('🔐 User logged out successfully');
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return SecureTokenManager.isAuthenticated();
  }

  /**
   * Get the underlying client instance
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus(): Promise<{
    isAuthenticated: boolean;
    hasValidToken: boolean;
    tokenExpiry: Date | null;
    csrfEnabled: boolean;
  }> {
    const token = await SecureTokenManager.getAccessToken();
    const expiry = SecureTokenManager.getTokenExpiry();
    const isAuthenticated = SecureTokenManager.isAuthenticated();

    return {
      isAuthenticated,
      hasValidToken: token !== null || isAuthenticated, // In secure mode, token is null but user can still be authenticated
      tokenExpiry: expiry,
      csrfEnabled: CSRFProtection.isCSRFEnabled(),
    };
  }

  /**
   * Manually refresh tokens
   */
  async manualRefresh(): Promise<boolean> {
    return this.refreshTokens();
  }
}

// Create and export the enhanced API client instance
export const enhancedApiClient = new EnhancedApiClient();

// Utility functions
export const isApiError = (error: unknown): error is ApiError => {
  return error !== null && typeof error === 'object' && 'success' in error && (error as ApiError).success === false;
};

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message || 'An error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
};

// Initialize the client when module loads
enhancedApiClient.initialize().catch(console.error);

export default enhancedApiClient;