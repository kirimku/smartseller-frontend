// Debug helper to expose authentication utilities to window for testing
import { TokenManager, apiClient } from './lib/api-client';

// Expose TokenManager and apiClient to window for debugging
declare global {
  interface Window {
    TokenManager: typeof TokenManager;
    apiClient: typeof apiClient;
    setTestToken: (token: string) => void;
    clearTestTokens: () => void;
    testApiCall: () => Promise<void>;
  }
}

// Helper function to set a test token
const setTestToken = (token: string) => {
  // Set a test token with a future expiry date (1 hour from now)
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  TokenManager.setAccessToken(token);
  TokenManager.setRefreshToken('test-refresh-token');
  TokenManager.setTokenExpiry(expiry);
  console.log('Test token set successfully');
  console.log('Access Token:', TokenManager.getAccessToken());
  console.log('Token Expiry:', TokenManager.getTokenExpiry());
  console.log('Is Expired:', TokenManager.isTokenExpired());
};

// Helper function to clear tokens
const clearTestTokens = () => {
  TokenManager.clearTokens();
  console.log('All tokens cleared');
};

// Helper function to test an API call
const testApiCall = async () => {
  try {
    console.log('Testing API call with current token...');
    const response = await apiClient.instance.get('/api/v1/products');
    console.log('API call successful:', response.data);
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.log('API call failed:', axiosError.response?.status, axiosError.response?.data || axiosError.message);
  }
};

// Expose to window
if (typeof window !== 'undefined') {
  window.TokenManager = TokenManager;
  window.apiClient = apiClient;
  window.setTestToken = setTestToken;
  window.clearTestTokens = clearTestTokens;
  window.testApiCall = testApiCall;
  
  console.log('Debug helpers exposed to window:');
  console.log('- window.TokenManager');
  console.log('- window.apiClient');
  console.log('- window.setTestToken(token)');
  console.log('- window.clearTestTokens()');
  console.log('- window.testApiCall()');
}

export { TokenManager, apiClient, setTestToken, clearTestTokens, testApiCall };