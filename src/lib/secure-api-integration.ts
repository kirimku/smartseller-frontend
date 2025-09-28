/**
 * Secure API Integration Layer
 * 
 * This module provides a seamless integration between the existing auth system
 * and the new enhanced security components. It acts as a bridge to gradually
 * migrate from localStorage-based tokens to secure httpOnly cookies.
 */

import { EnhancedApiClient } from './security/enhanced-api-client';
import { SecureTokenManager } from './security/secure-token-manager';
import { TokenManager } from './api-client';
import type { Client } from '../generated/api/client';

/**
 * Secure API Integration Manager
 * 
 * Manages the transition from legacy token storage to secure token management
 */
export class SecureApiIntegration {
  private static instance: SecureApiIntegration | null = null;
  private enhancedClient: EnhancedApiClient;
  private isInitialized = false;
  private migrationCompleted = false;

  private constructor() {
    this.enhancedClient = new EnhancedApiClient();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SecureApiIntegration {
    if (!SecureApiIntegration.instance) {
      SecureApiIntegration.instance = new SecureApiIntegration();
    }
    return SecureApiIntegration.instance;
  }

  /**
   * Initialize the secure API integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize the enhanced client
      await this.enhancedClient.initialize();
      
      // Check if migration is needed
      await this.checkAndMigrateLegacyTokens();
      
      this.isInitialized = true;
      console.log('Secure API integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize secure API integration:', error);
      throw error;
    }
  }

  /**
   * Check for legacy tokens and migrate them if needed
   */
  private async checkAndMigrateLegacyTokens(): Promise<void> {
    const legacyAccessToken = TokenManager.getAccessToken();
    const legacyRefreshToken = TokenManager.getRefreshToken();

    if (legacyAccessToken && legacyRefreshToken && !TokenManager.isTokenExpired()) {
      try {
        console.log('Migrating legacy tokens to secure storage...');
        
        // Set tokens in secure storage (using 1 hour default expiry)
        await SecureTokenManager.setTokens(legacyAccessToken, legacyRefreshToken, 3600);
        
        // Clear legacy tokens
        TokenManager.clearTokens();
        
        this.migrationCompleted = true;
        console.log('Legacy token migration completed successfully');
      } catch (error) {
        console.error('Failed to migrate legacy tokens:', error);
        // Don't throw error, allow fallback to legacy mode
      }
    }
  }

  /**
   * Get the enhanced API client
   */
  getClient(): Client {
    if (!this.isInitialized) {
      throw new Error('SecureApiIntegration not initialized. Call initialize() first.');
    }
    return this.enhancedClient.getClient();
  }

  /**
   * Get the enhanced client instance
   */
  getEnhancedClient(): EnhancedApiClient {
    if (!this.isInitialized) {
      throw new Error('SecureApiIntegration not initialized. Call initialize() first.');
    }
    return this.enhancedClient;
  }

  /**
   * Check if the integration is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if migration was completed
   */
  isMigrationCompleted(): boolean {
    return this.migrationCompleted;
  }

  /**
   * Set tokens using the secure token manager
   */
  async setTokens(accessToken: string, refreshToken: string, expiresIn: number = 3600): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    await SecureTokenManager.setTokens(accessToken, refreshToken, expiresIn);
  }

  /**
   * Clear all tokens
   */
  async clearTokens(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    await SecureTokenManager.clearTokens();
    
    // Also clear any remaining legacy tokens
    TokenManager.clearTokens();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return await this.enhancedClient.isAuthenticated();
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return await this.enhancedClient.manualRefresh();
  }

  /**
   * Get authentication status with fallback to legacy system
   */
  async getAuthStatus(): Promise<{
    isAuthenticated: boolean;
    isSecureMode: boolean;
    migrationCompleted: boolean;
  }> {
    let isAuthenticated = false;
    let isSecureMode = false;

    try {
      if (this.isInitialized) {
        isAuthenticated = await this.enhancedClient.isAuthenticated();
        isSecureMode = true;
      } else {
        // Fallback to legacy token check
        const token = TokenManager.getAccessToken();
        isAuthenticated = !!(token && !TokenManager.isTokenExpired());
        isSecureMode = false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Fallback to legacy check
      const token = TokenManager.getAccessToken();
      isAuthenticated = !!(token && !TokenManager.isTokenExpired());
      isSecureMode = false;
    }

    return {
      isAuthenticated,
      isSecureMode,
      migrationCompleted: this.migrationCompleted,
    };
  }

  /**
   * Handle authentication events
   */
  onAuthEvent(event: 'login' | 'logout' | 'refresh' | 'error', data?: unknown): void {
    switch (event) {
      case 'login':
        console.log('Authentication successful:', data);
        break;
      case 'logout':
        console.log('User logged out');
        this.clearTokens().catch(console.error);
        break;
      case 'refresh':
        console.log('Tokens refreshed successfully');
        break;
      case 'error':
        console.error('Authentication error:', data);
        break;
    }
  }
}

// Export singleton instance
export const secureApiIntegration = SecureApiIntegration.getInstance();

// Export convenience functions
export const initializeSecureApi = () => secureApiIntegration.initialize();
export const getSecureClient = () => secureApiIntegration.getClient();
export const getEnhancedClient = () => secureApiIntegration.getEnhancedClient();
export const isSecureApiReady = () => secureApiIntegration.isReady();