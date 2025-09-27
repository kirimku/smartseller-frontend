import { createClient, createConfig } from '../generated/api/client';
import type { Client, ClientOptions } from '../generated/api/client';
import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Extend Axios request config to include retry flag
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Token management
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'smartseller_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'smartseller_refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'smartseller_token_expiry';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static getTokenExpiry(): Date | null {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? new Date(expiry) : null;
  }

  static setTokenExpiry(expiry: string | Date): void {
    const expiryDate = typeof expiry === 'string' ? expiry : expiry.toISOString();
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryDate);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  static isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    return new Date() >= expiry;
  }

  static setTokens(accessToken: string, refreshToken: string, expiry: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
    this.setTokenExpiry(expiry);
  }
}

// Create the API client instance
export const apiClient: Client = createClient(createConfig<ClientOptions>({
  baseURL: API_BASE_URL,
}));

// Request interceptor for authentication
apiClient.instance.interceptors.request.use((config) => {
  const token = TokenManager.getAccessToken();
  
  if (token && !TokenManager.isTokenExpired()) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

// Response interceptor for error handling and token refresh
apiClient.instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenManager.getRefreshToken();
        
        if (refreshToken) {
          // Attempt to refresh the token
          const refreshResponse = await apiClient.post({
            url: '/api/v1/auth/refresh',
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });

          const responseData = refreshResponse.data as unknown;
          if (responseData && typeof responseData === 'object' && 'success' in responseData) {
            const typedResponse = responseData as { success: boolean; data?: { access_token: string; refresh_token: string; token_expiry: string } };
            if (typedResponse.success && typedResponse.data) {
              const { access_token, refresh_token, token_expiry } = typedResponse.data;
              
              if (access_token && refresh_token && token_expiry) {
                TokenManager.setTokens(access_token, refresh_token, token_expiry);
                
                // Retry the original request with new token
                originalRequest.headers.set('Authorization', `Bearer ${access_token}`);
                return apiClient.instance.request(originalRequest);
              }
            }
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // If refresh fails, clear tokens and redirect to login
      TokenManager.clearTokens();
      
      // Dispatch custom event for auth failure
      window.dispatchEvent(new CustomEvent('auth:logout', { 
        detail: { reason: 'token_expired' } 
      }));
    }

    return Promise.reject(error);
  }
);

// API Error types
export interface ApiError {
  success: boolean;
  message: string;
  error?: string;
  meta?: {
    http_status: number;
  };
}

// Utility functions for API responses
export const isApiError = (error: unknown): error is ApiError => {
  return error !== null && typeof error === 'object' && 'success' in error && (error as ApiError).success === false;
};

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message || 'An error occurred';
  }
  
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data) {
      return (axiosError.response.data as { message: string }).message;
    }
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  
  return 'An unexpected error occurred';
};

// Export token manager for use in components
export { TokenManager };

// Export the client as default
export default apiClient;