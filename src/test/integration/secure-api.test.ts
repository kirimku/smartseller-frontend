/**
 * Secure API Integration Tests
 * 
 * Tests for validating the secure API integration including:
 * - CSRF protection
 * - Token management
 * - Authentication flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { secureApiIntegration } from '../../lib/secure-api-integration';
import { CSRFProtection } from '../../lib/security/csrf-protection';
import { SecureTokenManager } from '../../lib/security/secure-token-manager';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Secure API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset any stored state
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('CSRF Protection', () => {
    it('should generate CSRF tokens', async () => {
      // Mock successful CSRF token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { csrf_token: 'test-csrf-token', expires_at: '2024-12-31T23:59:59Z' }
        })
      });

      const token = await CSRFProtection.getCSRFToken();
      expect(token).toBe('test-csrf-token');
    });

    it('should add CSRF headers to requests', async () => {
      // Mock CSRF token response first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { csrf_token: 'test-csrf-token', expires_at: '2024-12-31T23:59:59Z' }
        })
      });

      const headers = await CSRFProtection.addCSRFHeader();
      expect(headers).toHaveProperty('X-CSRF-Token', 'test-csrf-token');
    });

    it('should check if CSRF is enabled', () => {
      expect(typeof CSRFProtection.isCSRFEnabled()).toBe('boolean');
    });
  });

  describe('Secure Token Manager', () => {
    it('should initialize secure mode check', async () => {
      // Mock secure mode check response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      await SecureTokenManager.initialize();
      expect(SecureTokenManager.isSecureMode()).toBe(true);
    });

    it('should handle token storage in secure mode', async () => {
      // Mock secure token setting response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await SecureTokenManager.setTokens('access-token', 'refresh-token', 3600);
      
      // In test environment, should fall back to localStorage
      expect(localStorage.getItem('smartseller_access_token')).toBe('access-token');
    });

    it('should check authentication status', () => {
      // Set a valid token
      SecureTokenManager.setTokens('access-token', 'refresh-token', 3600);
      
      expect(SecureTokenManager.isAuthenticated()).toBe(true);
      expect(SecureTokenManager.getAccessToken()).toBe('access-token');
    });

    it('should clear tokens properly', async () => {
      // Set tokens first
      await SecureTokenManager.setTokens('access-token', 'refresh-token', 3600);
      
      // Clear tokens
      await SecureTokenManager.clearTokens();
      
      expect(SecureTokenManager.getAccessToken()).toBeNull();
      expect(SecureTokenManager.getRefreshToken()).toBeNull();
    });
  });

  describe('API Integration', () => {
    it('should initialize secure API integration', async () => {
      await secureApiIntegration.initialize();
      expect(secureApiIntegration.isReady()).toBe(true);
    });

    it('should provide enhanced client access', async () => {
      await secureApiIntegration.initialize();
      const client = secureApiIntegration.getEnhancedClient();
      expect(client).toBeDefined();
      expect(typeof client.login).toBe('function');
      expect(typeof client.logout).toBe('function');
    });

    it('should handle authentication status', async () => {
      await secureApiIntegration.initialize();
      
      const authStatus = await secureApiIntegration.getAuthStatus();
      expect(authStatus).toHaveProperty('isAuthenticated');
      expect(authStatus).toHaveProperty('isSecureMode');
      expect(authStatus).toHaveProperty('migrationCompleted');
    });

    it('should handle token refresh', async () => {
      await secureApiIntegration.initialize();
      
      // Mock successful refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600
          }
        })
      });

      const result = await secureApiIntegration.refreshTokens();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Token Management', () => {
    it('should check authentication status', async () => {
      const isAuthenticated = await secureApiIntegration.isAuthenticated();
      expect(typeof isAuthenticated).toBe('boolean');
    });

    it('should handle token clearing', async () => {
      await secureApiIntegration.clearTokens();
      const isAuthenticated = await secureApiIntegration.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });

    it('should handle token refresh', async () => {
       // Mock successful refresh response
       mockFetch.mockResolvedValueOnce({
         ok: true,
         json: () => Promise.resolve({
           success: true,
           data: {
             access_token: 'new-access-token',
             refresh_token: 'new-refresh-token'
           }
         })
       });

       const result = await secureApiIntegration.refreshTokens();
       expect(result).toBe(true);
     });
  });
});