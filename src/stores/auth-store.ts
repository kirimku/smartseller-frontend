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
      
      // Try enhanced client first, fallback to regular client
      const enhancedClient = getEnhancedClient();
      const loginSuccess = await enhancedClient.login({
         email: data.email_or_phone,
         password: data.password,
       });
      
      if (loginSuccess) {
        // Get user data using the enhanced client
        const response = await postApiV1AuthLogin({
          body: data,
          client: enhancedClient.getClient(),
        });
        
        if (response.data?.success && response.data?.data) {
          const { user } = response.data.data;
          return { user };
        }
      }
      
      throw new Error('Login failed');
    },
    onSuccess: (data) => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
      queryClient.setQueryData(authKeys.user(), data.user);
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
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async (): Promise<UserDto | null> => {
      const token = TokenManager.getAccessToken();
      if (!token || TokenManager.isTokenExpired()) {
        return null;
      }
      
      // For now, return null as we don't have a user profile endpoint
      // This would typically fetch from /api/v1/auth/me or similar
      return null;
    },
    enabled: !!TokenManager.getAccessToken() && !TokenManager.isTokenExpired(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

// Auth status hook
export const useAuthStatus = () => {
  const { data: user, isLoading } = useUserProfile();
  const token = TokenManager.getAccessToken();
  const isAuthenticated = !!token && !TokenManager.isTokenExpired();
  
  return {
    user,
    isAuthenticated,
    isLoading,
  };
};