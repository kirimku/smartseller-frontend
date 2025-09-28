// Debug script to check authentication state
console.log('=== Authentication Debug Script ===');

// Check localStorage for tokens (using correct keys from TokenManager)
console.log('\n1. Checking localStorage for tokens:');
const accessToken = localStorage.getItem('smartseller_access_token');
const refreshToken = localStorage.getItem('smartseller_refresh_token');
const tokenExpiry = localStorage.getItem('smartseller_token_expiry');

console.log('Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NOT FOUND');
console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'NOT FOUND');
console.log('Token Expiry:', tokenExpiry);

// Check if tokens are expired
if (tokenExpiry) {
  const expiryDate = new Date(parseInt(tokenExpiry));
  const now = new Date();
  console.log('Token Expiry Date:', expiryDate);
  console.log('Current Date:', now);
  console.log('Is Token Expired:', now > expiryDate);
}

// Check all localStorage keys
console.log('\n2. All localStorage keys:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`${key}:`, value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : 'null');
}

// Check if user is logged in according to the app
console.log('\n3. Checking authentication state:');
try {
  // Try to access the auth store if available
  if (window.authStore) {
    console.log('Auth Store State:', window.authStore.getState());
  } else {
    console.log('Auth Store not available on window object');
  }
} catch (error) {
  console.log('Error accessing auth store:', error.message);
}

// Check if there are any authentication-related cookies
console.log('\n4. Checking cookies:');
console.log('Document cookies:', document.cookie);

// Check current URL and origin
console.log('\n5. Current context:');
console.log('Current URL:', window.location.href);
console.log('Origin:', window.location.origin);

// Test TokenManager methods if available
console.log('\n6. Testing TokenManager methods:');
try {
  // Try to import and test TokenManager
  if (window.TokenManager) {
    console.log('TokenManager available on window');
    console.log('getAccessToken():', window.TokenManager.getAccessToken());
    console.log('isTokenExpired():', window.TokenManager.isTokenExpired());
  } else {
    console.log('TokenManager not available on window object');
  }
} catch (error) {
  console.log('Error testing TokenManager:', error.message);
}

// Check if we can access the apiClient
console.log('\n7. Testing API Client:');
try {
  if (window.apiClient) {
    console.log('API Client available on window');
    console.log('Base URL:', window.apiClient.instance.defaults.baseURL);
    console.log('Request interceptors count:', window.apiClient.instance.interceptors.request.handlers.length);
  } else {
    console.log('API Client not available on window object');
  }
} catch (error) {
  console.log('Error accessing API Client:', error.message);
}

// Check if we're on the login page or authenticated area
console.log('\n8. Page context:');
console.log('Current pathname:', window.location.pathname);
console.log('Page title:', document.title);

// Check for any authentication-related elements on the page
const loginElements = document.querySelectorAll('[data-testid*="login"], [class*="login"], [id*="login"]');
const authElements = document.querySelectorAll('[data-testid*="auth"], [class*="auth"], [id*="auth"]');
console.log('Login-related elements found:', loginElements.length);
console.log('Auth-related elements found:', authElements.length);

console.log('\n=== End Debug Script ===');