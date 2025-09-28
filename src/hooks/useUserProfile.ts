/**
 * User Profile Hooks
 * 
 * React hooks for user profile management with React Query integration
 * Provides efficient data fetching, caching, and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userProfileService, type UserProfileData, UserProfileServiceError } from '../services/user-profile';
import { useAuth } from '../contexts/AuthContext';

// Query keys for React Query
export const userProfileKeys = {
  all: ['userProfile'] as const,
  profile: () => [...userProfileKeys.all, 'current'] as const,
  details: (id: string) => [...userProfileKeys.all, 'details', id] as const,
};

/**
 * Hook to fetch current user profile
 */
export const useUserProfile = (options?: {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: userProfileKeys.profile(),
    queryFn: () => userProfileService.getCurrentUser(),
    enabled: isAuthenticated && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof UserProfileServiceError && error.status === 401) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook to refresh user profile
 */
export const useRefreshUserProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => userProfileService.refreshProfile(),
    onSuccess: (data) => {
      // Update the cache with fresh data
      queryClient.setQueryData(userProfileKeys.profile(), data);
    },
    onError: (error) => {
      console.error('Failed to refresh user profile:', error);
      // Invalidate the query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: userProfileKeys.profile() });
    },
  });
};

/**
 * Hook to get user profile with loading and error states
 */
export const useUserProfileState = () => {
  const { data: user, isLoading, error, refetch } = useUserProfile();
  const refreshMutation = useRefreshUserProfile();
  
  return {
    user,
    isLoading: isLoading || refreshMutation.isPending,
    error: error || refreshMutation.error,
    isError: !!error || refreshMutation.isError,
    refetch,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
};

/**
 * Hook to check user permissions and roles
 */
export const useUserPermissions = () => {
  const { data: user } = useUserProfile();
  
  return {
    user,
    hasRole: (role: string) => userProfileService.hasRole(user || null, role),
    isAdmin: () => userProfileService.isAdmin(user || null),
    hasMinimumTier: (tier: string) => userProfileService.hasMinimumTier(user || null, tier),
    getDisplayName: () => userProfileService.getDisplayName(user || null),
    formatWalletBalance: () => userProfileService.formatWalletBalance(user || null),
    getTierDisplayName: () => userProfileService.getTierDisplayName(user?.user_tier),
  };
};

/**
 * Hook to get user profile with computed values
 */
export const useUserProfileComputed = () => {
  const { data: user, isLoading, error } = useUserProfile();
  
  const computedValues = {
    displayName: userProfileService.getDisplayName(user || null),
    formattedBalance: userProfileService.formatWalletBalance(user || null),
    tierDisplayName: userProfileService.getTierDisplayName(user?.user_tier),
    isAdmin: userProfileService.isAdmin(user || null),
    isVerified: user?.isVerified || false,
    tierLevel: user?.tierLevel || 0,
  };
  
  return {
    user,
    isLoading,
    error,
    ...computedValues,
  };
};

/**
 * Hook to invalidate user profile cache
 */
export const useInvalidateUserProfile = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: userProfileKeys.all });
    userProfileService.clearCache();
  };
};

/**
 * Hook to prefetch user profile
 */
export const usePrefetchUserProfile = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  
  return () => {
    if (isAuthenticated) {
      queryClient.prefetchQuery({
        queryKey: userProfileKeys.profile(),
        queryFn: () => userProfileService.getCurrentUser(),
        staleTime: 5 * 60 * 1000,
      });
    }
  };
};

/**
 * Hook for user profile with optimistic updates
 */
export const useOptimisticUserProfile = () => {
  const queryClient = useQueryClient();
  const { data: user, ...queryResult } = useUserProfile();
  
  const updateOptimistically = (updates: Partial<UserProfileData>) => {
    if (user) {
      const optimisticUser = { ...user, ...updates };
      queryClient.setQueryData(userProfileKeys.profile(), optimisticUser);
    }
  };
  
  const revertOptimisticUpdate = () => {
    queryClient.invalidateQueries({ queryKey: userProfileKeys.profile() });
  };
  
  return {
    user,
    ...queryResult,
    updateOptimistically,
    revertOptimisticUpdate,
  };
};

// Export all hooks
export default useUserProfile;