import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  postApiV1AuthLogin, 
  postApiV1AuthLogout, 
  postApiV1AuthRefresh,
  postApiV1AuthForgotPassword,
  postApiV1AuthResetPassword,
} from '../generated/api/sdk.gen';
import type { 
  PostApiV1AuthLoginData,
  PostApiV1AuthForgotPasswordData,
  PostApiV1AuthResetPasswordData,
} from '../generated/api/types.gen';
import { TokenManager } from '../lib/api-client';
import { secureApiIntegration, getEnhancedClient } from '../lib/secure-api-integration';

// User type definition for auth context
interface UserDto {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

// Auth query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
} as const;

// Auth state interface
export interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Get current auth state
export const getAuthState = async (): Promise<AuthState> => {
  try {
    const isAuthenticated = await secureApiIntegration.isAuthenticated();
    
    return {
      user: null, // Will be populated by user query
      isAuthenticated,
      isLoading: false,
    };
  } catch (error) {
    // Fallback to legacy token check
    const token = TokenManager.getAccessToken();
    const isTokenValid = token && !TokenManager.isTokenExpired();
    
    return {
      user: null,
      isAuthenticated: !!isTokenValid,
      isLoading: false,
    };
  }
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PostApiV1AuthLoginData['body']) => {
      const response = await postApiV1AuthLogin({
        body: data,
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('🔐 [auth-store] Login successful, response data:', data);
      
      // Extract and store tokens from the response
      if (data?.success && data.data) {
        const { access_token, refresh_token, token_expiry, user } = data.data;
        
        if (access_token && refresh_token && token_expiry) {
          console.log('🔐 [auth-store] Storing tokens in localStorage');
          TokenManager.setTokens(access_token, refresh_token, token_expiry);
          
          // Store user data in query cache
          if (user) {
            const userDto: UserDto = {
              id: user.id || '',
              email: user.email || '',
              first_name: user.first_name,
              last_name: user.last_name,
              phone: user.phone,
              status: user.status,
              created_at: user.created_at,
              updated_at: user.updated_at,
            };
            queryClient.setQueryData(authKeys.user(), userDto);
          }
        } else {
          console.warn('🔐 [auth-store] Login response missing required token fields');
        }
      }
      
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
    onError: (error) => {
      console.error('Login failed:', error);
      TokenManager.clearTokens();
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await postApiV1AuthLogout();
      return response.data;
    },
    onSuccess: () => {
      console.log('🔐 [auth-store] Logout successful, clearing tokens and cache');
      
      // Clear tokens from localStorage
      TokenManager.clearTokens();
      
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: authKeys.all });
      
      // Specifically clear auth status
      queryClient.removeQueries({ queryKey: ['auth', 'status'] });
      queryClient.setQueryData(['auth', 'status'], false);
      
      queryClient.clear();
    },
    onError: () => {
      // Even if logout API fails, clear local tokens
      console.log('🔐 [auth-store] Logout API failed, but clearing local tokens anyway');
      TokenManager.clearTokens();
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
};

// Refresh token mutation
export const useRefreshToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await postApiV1AuthRefresh();
      return response.data;
    },
    onSuccess: (data) => {
      console.log('🔐 [auth-store] Token refresh successful, response data:', data);
      
      // Extract and store new tokens from the response
      if (data?.success && data.data) {
        const { access_token, refresh_token, token_expiry } = data.data;
        
        if (access_token && refresh_token && token_expiry) {
          console.log('🔐 [auth-store] Storing refreshed tokens in localStorage');
          TokenManager.setTokens(access_token, refresh_token, token_expiry);
        } else {
          console.warn('🔐 [auth-store] Refresh response missing required token fields');
        }
      }
    },
    onError: () => {
      console.log('🔐 [auth-store] Token refresh failed, clearing tokens');
      TokenManager.clearTokens();
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: PostApiV1AuthForgotPasswordData['body']) => {
      const response = await postApiV1AuthForgotPassword({
        body: data,
      });
      return response.data;
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: PostApiV1AuthResetPasswordData['body']) => {
      const response = await postApiV1AuthResetPassword({
        body: data,
      });
      return response.data;
    },
  });
};

// Note: Google login endpoints are not implemented in the current API

// User profile query (requires authentication)
export const useUserProfile = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async (): Promise<UserDto | null> => {
      // Check if user is authenticated first
      const isAuthenticated = await secureApiIntegration.isAuthenticated();
      if (!isAuthenticated) {
        console.log('🔐 [auth-store] User not authenticated, returning null');
        return null;
      }
      
      // Check for cached data
      const cachedUser = queryClient.getQueryData<UserDto>(authKeys.user());
      if (cachedUser) {
        console.log('🔐 [auth-store] Using cached user data:', cachedUser.email);
        return cachedUser;
      }
      
      try {
        // Fetch user profile from API
        console.log('🔐 [auth-store] No cached user data found, fetching from API...');
        const enhancedClient = await getEnhancedClient();
        const client = enhancedClient.getClient();
        
        const response = await client.get({
          url: '/api/v1/users/me',
        });
        
        interface UserProfileApiResponse {
          success: boolean;
          data?: UserDto;
          message?: string;
        }
        
        const responseData = response.data as UserProfileApiResponse;
        if (responseData?.success && responseData?.data) {
          const userData = responseData.data;
          console.log('🔐 [auth-store] User profile fetched successfully:', userData);
          
          // Cache the user data
          queryClient.setQueryData(authKeys.user(), userData);
          
          return userData;
        } else {
          console.warn('🔐 [auth-store] Invalid response format from user profile API:', responseData);
          return null;
        }
      } catch (error) {
        console.error('🔐 [auth-store] Failed to fetch user profile:', error);
        return null;
      }
    },
    enabled: true, // Always enabled, but queryFn will handle auth check
    staleTime: 1 * 60 * 1000, // 1 minute - more aggressive refetch
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Auth status hook
export const useAuthStatus = () => {
  const { data: user, isLoading } = useUserProfile();
  
  // Use a simple query to get auth status
  const { data: isAuthenticated = false, isFetching, isStale } = useQuery({
    queryKey: ['auth', 'status'],
    queryFn: async () => {
      console.log('🔍 [useAuthStatus] Checking authentication status...');
      const result = await secureApiIntegration.isAuthenticated();
      console.log('🔍 [useAuthStatus] Authentication check result:', result);
      return result;
    },
    staleTime: 5000, // Cache for 5 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  console.log('🔍 [useAuthStatus] Current state:', {
    user: user?.email || 'null',
    isAuthenticated,
    isLoading,
    isFetching,
    isStale,
    hasToken: !!localStorage.getItem('auth_token') || !!sessionStorage.getItem('auth_token')
  });
  
  return {
    user,
    isAuthenticated,
    isLoading,
  };
};