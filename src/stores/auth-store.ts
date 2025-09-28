import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  postApiV1AuthLogin, 
  postApiV1AuthLogout, 
  postApiV1AuthRefresh,
  postApiV1AuthForgotPassword,
  postApiV1AuthResetPassword,
  getApiV1AuthGoogleLogin,
  postApiV1AuthGoogleCallback
} from '../generated/api/sdk.gen';
import type { 
  PostApiV1AuthLoginData,
  PostApiV1AuthForgotPasswordData,
  PostApiV1AuthResetPasswordData,
  PostApiV1AuthGoogleCallbackData,
  UserDto
} from '../generated/api/types.gen';
import { TokenManager, apiClient } from '../lib/api-client';
import { secureApiIntegration, getEnhancedClient } from '../lib/secure-api-integration';

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
      // Initialize secure API if not already done
      await secureApiIntegration.initialize();
      
      // Use the enhanced client for login
      const enhancedClient = getEnhancedClient();
      
      // Make the login API call directly to get both tokens and user data
      const response = await postApiV1AuthLogin({
        body: data,
        client: enhancedClient.getClient(),
      });
      
      if (response.data?.success && response.data?.data) {
        const { user, access_token, refresh_token, token_expiry } = response.data.data;
        
        if (access_token && refresh_token && user) {
          // Calculate expires_in from token_expiry
          let expiresIn = 3600; // Default to 1 hour
          if (token_expiry) {
            try {
              const expiryDate = new Date(token_expiry);
              const now = new Date();
              expiresIn = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / 1000));
            } catch (error) {
              console.warn('Failed to parse token_expiry, using default:', error);
            }
          }
          
          // Store tokens using the secure token manager
          await secureApiIntegration.setTokens(access_token, refresh_token, expiresIn);
          
          console.log('✅ Login successful, tokens stored and user data received');
          return { user };
        }
      }
      
      throw new Error('Login failed');
    },
    onSuccess: (data) => {
      // Set user data in the cache
      queryClient.setQueryData(authKeys.user(), data.user);
      
      // Invalidate auth status query to immediately update isAuthenticated
      queryClient.invalidateQueries({ queryKey: ['auth', 'status'] });
      
      // Also set the auth status to true immediately
      queryClient.setQueryData(['auth', 'status'], true);
      
      console.log('✅ User data set in cache and auth status updated:', data.user);
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
      try {
        // Use enhanced client for secure logout
        const enhancedClient = getEnhancedClient();
        await enhancedClient.logout();
      } catch (error) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed:', error);
        // Fallback to manual token clearing
        await secureApiIntegration.clearTokens();
      }
    },
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: authKeys.all });
      
      // Specifically clear auth status
      queryClient.removeQueries({ queryKey: ['auth', 'status'] });
      queryClient.setQueryData(['auth', 'status'], false);
      
      queryClient.clear();
    },
  });
};

// Refresh token mutation
export const useRefreshToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Use enhanced client for secure token refresh
      const success = await secureApiIntegration.refreshTokens();
      
      if (!success) {
        throw new Error('Token refresh failed');
      }
      
      return { success: true };
    },
    onError: () => {
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
        client: apiClient,
      });
      
      if (response.data?.success) {
        return response.data;
      }
      
      throw new Error(response.data?.message || 'Failed to send reset email');
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: PostApiV1AuthResetPasswordData['body']) => {
      const response = await postApiV1AuthResetPassword({
        body: data,
        client: apiClient,
      });
      
      if (response.data?.success) {
        return response.data;
      }
      
      throw new Error(response.data?.message || 'Password reset failed');
    },
  });
};

// Google login URL query
export const useGoogleLoginUrl = () => {
  return useQuery({
    queryKey: ['auth', 'google-login-url'],
    queryFn: async () => {
      const response = await getApiV1AuthGoogleLogin({
        client: apiClient,
      });
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Failed to get Google login URL');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Only fetch when explicitly requested
  });
};

// Google login callback mutation
export const useGoogleLoginCallback = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PostApiV1AuthGoogleCallbackData['body']) => {
      const response = await postApiV1AuthGoogleCallback({
        body: data,
        client: apiClient,
      });
      
      if (response.data?.success && response.data?.data) {
        const { access_token, refresh_token, token_expiry, user } = response.data.data;
        
        if (access_token && refresh_token && token_expiry) {
          TokenManager.setTokens(access_token, refresh_token, token_expiry);
          return { user, tokens: { access_token, refresh_token, token_expiry } };
        }
      }
      
      throw new Error(response.data?.message || 'Google login failed');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
      queryClient.setQueryData(authKeys.user(), data.user);
    },
    onError: (error) => {
      console.error('Google login failed:', error);
      TokenManager.clearTokens();
    },
  });
};

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