/**
 * User Profile Service
 * 
 * Provides user profile management functionality including:
 * - Fetching current user profile
 * - Updating user profile data
 * - Profile caching and error handling
 * - Integration with secure authentication
 */

import { getApiV1UsersMe } from '../generated/api/sdk.gen';
import type { UserProfileResponse } from '../generated/api/types.gen';
import { enhancedApiClient } from '../lib/security/enhanced-api-client';

export interface UserProfileData extends UserProfileResponse {
  // Additional computed fields
  fullName?: string;
  displayName?: string;
  isVerified?: boolean;
  tierLevel?: number;
}

/**
 * User Profile Service Class
 */
export class UserProfileService {
  private static cache: UserProfileData | null = null;
  private static cacheExpiry: Date | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current user profile with caching
   */
  static async getCurrentUser(forceRefresh = false): Promise<UserProfileData> {
    // Check cache first
    if (!forceRefresh && this.cache && this.cacheExpiry && this.cacheExpiry > new Date()) {
      return this.cache;
    }

    try {
      // Ensure API client is initialized
      await enhancedApiClient.initialize();

      // Check authentication status
      const authStatus = await enhancedApiClient.getAuthStatus();
      if (!authStatus.isAuthenticated) {
        throw new UserProfileServiceError('User not authenticated', 'AUTH_REQUIRED', 401);
      }

      // Fetch user profile
      const response = await getApiV1UsersMe({
        client: enhancedApiClient.getClient(),
      });

      if (response.error) {
        throw new UserProfileServiceError(
          response.error.message || 'Failed to fetch user profile',
          'API_ERROR'
        );
      }

      if (!response.data?.success || !response.data.data) {
        throw new UserProfileServiceError(
          response.data?.message || 'Invalid response format',
          'INVALID_RESPONSE'
        );
      }

      // Process and enhance user data
      const userData = this.enhanceUserData(response.data.data);

      // Update cache
      this.cache = userData;
      this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION);

      return userData;
    } catch (error) {
      // Clear cache on error
      this.clearCache();

      if (error instanceof UserProfileServiceError) {
        throw error;
      }

      // Handle different error types
      if (error && typeof error === 'object' && 'status' in error) {
        const errorObj = error as { status: unknown };
        const status = typeof errorObj.status === 'number' ? errorObj.status : 0;
        if (status === 401) {
          throw new UserProfileServiceError('Authentication required', 'AUTH_REQUIRED', 401);
        } else if (status === 403) {
          throw new UserProfileServiceError('Access forbidden', 'ACCESS_FORBIDDEN', 403);
        } else if (status >= 500) {
          throw new UserProfileServiceError('Server error', 'SERVER_ERROR', status);
        }
      }

      throw new UserProfileServiceError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Enhance user data with computed fields
   */
  private static enhanceUserData(userData: UserProfileResponse): UserProfileData {
    const enhanced: UserProfileData = {
      ...userData,
      fullName: userData.name || '',
      displayName: userData.name || userData.email || 'User',
      isVerified: userData.accept_terms === true,
      tierLevel: this.getTierLevel(userData.user_tier),
    };

    return enhanced;
  }

  /**
   * Get numeric tier level for easier comparison
   */
  private static getTierLevel(tier?: string): number {
    switch (tier) {
      case 'pendekar': return 1;
      case 'tuan_muda': return 2;
      case 'tuan_besar': return 3;
      case 'tuan_raja': return 4;
      default: return 0;
    }
  }

  /**
   * Clear user profile cache
   */
  static clearCache(): void {
    this.cache = null;
    this.cacheExpiry = null;
  }

  /**
   * Get cached user profile (if available and valid)
   */
  static getCachedUser(): UserProfileData | null {
    if (this.cache && this.cacheExpiry && this.cacheExpiry > new Date()) {
      return this.cache;
    }
    return null;
  }

  /**
   * Check if user has specific role
   */
  static hasRole(user: UserProfileData | null, role: string): boolean {
    return user?.user_role === role;
  }

  /**
   * Check if user has admin privileges
   */
  static isAdmin(user: UserProfileData | null): boolean {
    return user?.is_admin === true || user?.user_role === 'admin' || user?.user_role === 'owner';
  }

  /**
   * Check if user has minimum tier level
   */
  static hasMinimumTier(user: UserProfileData | null, minimumTier: string): boolean {
    if (!user) return false;
    const userLevel = this.getTierLevel(user.user_tier);
    const requiredLevel = this.getTierLevel(minimumTier);
    return userLevel >= requiredLevel;
  }

  /**
   * Format user display name
   */
  static getDisplayName(user: UserProfileData | null): string {
    if (!user) return 'Guest';
    return user.displayName || user.name || user.email || 'User';
  }

  /**
   * Format wallet balance
   */
  static formatWalletBalance(user: UserProfileData | null): string {
    if (!user || typeof user.wallet_balance !== 'number') {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(user.wallet_balance);
  }

  /**
   * Get user tier display name
   */
  static getTierDisplayName(tier?: string): string {
    switch (tier) {
      case 'pendekar': return 'Pendekar';
      case 'tuan_muda': return 'Tuan Muda';
      case 'tuan_besar': return 'Tuan Besar';
      case 'tuan_raja': return 'Tuan Raja';
      default: return 'Member';
    }
  }

  /**
   * Refresh user profile (force cache refresh)
   */
  static async refreshProfile(): Promise<UserProfileData> {
    return this.getCurrentUser(true);
  }
}

/**
 * Custom error class for user profile service
 */
export class UserProfileServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'UserProfileServiceError';
  }
}

// Export default instance
export const userProfileService = UserProfileService;

// Export convenience functions
export const {
  getCurrentUser,
  clearCache,
  getCachedUser,
  hasRole,
  isAdmin,
  hasMinimumTier,
  getDisplayName,
  formatWalletBalance,
  getTierDisplayName,
  refreshProfile,
} = UserProfileService;

export default userProfileService;