// Debug helper to expose authentication utilities to window for testing
import { SecureTokenManager } from './lib/security/secure-token-manager';
import { enhancedApiClient } from './lib/security/enhanced-api-client';

// Expose SecureTokenManager and enhancedApiClient to window for debugging
declare global {
  interface Window {
    SecureTokenManager: typeof SecureTokenManager;
    enhancedApiClient: typeof enhancedApiClient;
    setTestToken: (accessToken: string, refreshToken?: string) => Promise<void>;
    clearTestTokens: () => Promise<void>;
    testApiCall: () => Promise<void>;
    testLogin: (email: string, password: string) => Promise<void>;
    checkAuthStatus: () => Promise<void>;
  }
}

// Helper function to set test tokens
const setTestToken = async (accessToken: string, refreshToken = 'test-refresh-token') => {
  try {
    // Set tokens with 1 hour expiry
    const expiresIn = 3600; // 1 hour in seconds
    await SecureTokenManager.setTokens(accessToken, refreshToken, expiresIn);
    console.log('Test tokens set successfully');
    console.log('Tokens are now stored securely');
  } catch (error) {
    console.error('Failed to set test tokens:', error);
  }
};

// Helper function to clear tokens
const clearTestTokens = async () => {
  try {
    await SecureTokenManager.clearTokens();
    console.log('All tokens cleared');
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
};

// Helper function to test an API call
const testApiCall = async () => {
  try {
    console.log('Testing API call with current token...');
    const response = await enhancedApiClient.getClient().get({ url: '/api/v1/products' });
    console.log('API call successful:', response.data);
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.log('API call failed:', axiosError.response?.status, axiosError.response?.data || axiosError.message);
  }
};

// Helper function to test login
const testLogin = async (email: string, password: string) => {
  try {
    console.log('Testing login with:', email);
    const success = await enhancedApiClient.login({ email_or_phone: email, password });
    if (success) {
      console.log('Login successful');
    } else {
      console.log('Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};

// Helper function to check authentication status
const checkAuthStatus = async () => {
  try {
    const isAuth = await enhancedApiClient.isAuthenticated();
    const authStatus = await enhancedApiClient.getAuthStatus();
    console.log('Authentication Status:', {
      isAuthenticated: isAuth,
      authStatus
    });
  } catch (error) {
    console.error('Failed to check auth status:', error);
  }
};

// Expose to window
if (typeof window !== 'undefined') {
  window.SecureTokenManager = SecureTokenManager;
  window.enhancedApiClient = enhancedApiClient;
  window.setTestToken = setTestToken;
  window.clearTestTokens = clearTestTokens;
  window.testApiCall = testApiCall;
  window.testLogin = testLogin;
  window.checkAuthStatus = checkAuthStatus;
}

export { 
  SecureTokenManager, 
  enhancedApiClient, 
  setTestToken, 
  clearTestTokens, 
  testApiCall, 
  testLogin, 
  checkAuthStatus 
};