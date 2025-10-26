import type { ApiResponse, ApiError } from '../shared/types';
import { SecureTokenManager } from '../lib/security/secure-token-manager';

/**
 * API Configuration
 */
export interface ApiConfig {
  baseURL: string;
  timeout: number;
}

/**
 * Default API Configuration
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  baseURL: (import.meta.env.VITE_BACKEND_HOST || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090') + '/api/v1',
  timeout: 30000,
};

/**
 * API endpoint constants
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER: '/auth/register',
  },

  // Users
  USERS: {
    ME: '/users/me',
    GET: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
  },

  // Tenants
  TENANTS: {
    LIST: '/tenants',
    GET: (id: string) => `/tenants/${id}`,
    CREATE: '/tenants',
    UPDATE: (id: string) => `/tenants/${id}`,
  },

  // Products
  PRODUCTS: {
    LIST: '/products',
    GET: (id: string) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string) => `/products/${id}`,
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    GET: (id: string) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE: (id: string) => `/orders/${id}`,
  },
} as const;

/**
 * Simple HTTP client interface
 */
export interface HttpClient {
  get<T>(url: string): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: unknown): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: unknown): Promise<ApiResponse<T>>;
  delete<T>(url: string): Promise<ApiResponse<T>>;
}

/**
 * Basic fetch-based HTTP client
 */
export class SimpleHttpClient implements HttpClient {
  private config: ApiConfig;

  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config;
  }

  private async makeRequest<T>(
    method: string,
    url: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    const fullUrl = `${this.config.baseURL}${url}`;
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token is available
    const accessToken = SecureTokenManager.getAccessToken();
    const isSecureMode = SecureTokenManager.isSecureMode();
    const isAuthenticated = SecureTokenManager.isAuthenticated();
    
    console.log('🔍 Token Manager Status:', {
      isSecureMode,
      isAuthenticated,
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length || 0
    });
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('🔑 Adding Authorization header with token:', accessToken.substring(0, 20) + '...');
    } else if (isSecureMode) {
      console.log('🍪 Secure mode enabled - relying on httpOnly cookies for authentication');
    } else {
      console.warn('⚠️ No access token found for API request');
    }

    // Add CSRF token if available
    const csrfToken = SecureTokenManager.getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
      console.log('🛡️ Adding CSRF token:', csrfToken.substring(0, 10) + '...');
    }

    const requestOptions = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include' as RequestCredentials, // Include cookies for secure mode
    };

    console.log('🚀 Making API request:', {
      url: fullUrl,
      method,
      headers: { ...headers, Authorization: headers.Authorization ? 'Bearer [REDACTED]' : undefined },
      hasBody: !!data,
      credentials: requestOptions.credentials
    });

    console.log('📋 Full fetch configuration:', {
      url: fullUrl,
      options: {
        ...requestOptions,
        headers: { ...headers, Authorization: headers.Authorization ? 'Bearer [REDACTED]' : undefined }
      }
    });
    
    try {
      const response = await fetch(fullUrl, requestOptions);

      console.log('📡 API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('✅ API response data:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ API request failed:', {
        url: fullUrl,
        method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'REQUEST_FAILED',
        status: 0,
        details: {},
      } as ApiError;
    }
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('GET', url);
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('POST', url, data);
  }

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PUT', url, data);
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('DELETE', url);
  }
}

/**
 * Default HTTP client instance
 */
export const httpClient = new SimpleHttpClient();

export default httpClient;