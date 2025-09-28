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
        
        await SecureTokenManager.setTokens(access_token, refresh_token, token_expiry);
        
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
    // Clear all tokens and auth data
    await SecureTokenManager.clearTokens();
    CSRFProtection.clearCSRFToken();

    // Dispatch custom event for auth failure
    window.dispatchEvent(new CustomEvent('auth:logout', { 
      detail: { reason } 
    }));

    console.log(`🔐 Authentication failure handled: ${reason}`);
  }

  /**
   * Login with credentials
   */
  async login(credentials: { email: string; password: string }): Promise<boolean> {
    try {
      const response = await this.client.post({
        url: '/api/v1/auth/login',
        body: credentials,
        headers: await CSRFProtection.addCSRFHeader(),
      });

      const responseData = response.data as TokenRefreshResponse;
      
      if (responseData.success && responseData.data) {
        const { access_token, refresh_token, token_expiry } = responseData.data;
        
        await SecureTokenManager.setTokens(access_token, refresh_token, token_expiry);
        
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
        // Ignore logout endpoint errors
        console.warn('⚠️ Logout endpoint not available or failed');
      });
    } finally {
      // Always clear local tokens
      await this.handleAuthFailure('user_logout');
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await SecureTokenManager.getAccessToken();
    return token !== null && !SecureTokenManager.isTokenExpired();
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
    const isExpired = SecureTokenManager.isTokenExpired();

    return {
      isAuthenticated: token !== null && !isExpired,
      hasValidToken: token !== null,
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