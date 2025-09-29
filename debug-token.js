// Debug script to check token storage and API client
console.log('=== Token Debug ===');
console.log('Access Token:', localStorage.getItem('smartseller_access_token'));
console.log('Refresh Token:', localStorage.getItem('smartseller_refresh_token'));
console.log('Token Expiry:', localStorage.getItem('smartseller_token_expiry'));

// Check if token is expired
const expiry = localStorage.getItem('smartseller_token_expiry');
if (expiry) {
  const expiryDate = new Date(expiry);
  const now = new Date();
  console.log('Token expires at:', expiryDate);
  console.log('Current time:', now);
  console.log('Token expired:', now >= expiryDate);
} else {
  console.log('No expiry date found');
}