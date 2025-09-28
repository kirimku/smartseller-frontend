import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  useLogin, 
  useLogout, 
  useAuthStatus, 
  useForgotPassword, 
  useResetPassword,
  useGoogleLoginUrl,
  useGoogleLoginCallback,
  useUserProfile
} from '../stores/auth-store';
import type { UserDto } from '../generated/api/types.gen';
import { getErrorMessage } from '../lib/api-client';
import { ErrorHandler, requiresReauth } from '../lib/error-handler';
import { useQueryClient } from '@tanstack/react-query';

export type UserRole = 'admin' | 'user' | 'manager' | null;

// Actual backend UserDto structure (different from generated types)
interface BackendUserDto {
  id: string;
  email: string;
  name: string;
  user_role: string;
  phone?: string;
  picture?: string;
  is_admin: boolean;
  user_tier: string;
  user_type: string;
  transaction_count: number;
  wallet_balance: number;
  wallet_id: string;
  accept_promos: boolean;
  accept_terms: boolean;
  created_at: string;
  updated_at: string;
}

// Basic User interface from authentication
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  avatar?: string;
  permissions?: string[];
  createdAt: string;
  lastLoginAt?: string;
}

// Convert UserDto to User
const mapUserDtoToUser = (userDto: BackendUserDto | null): User | null => {
  if (!userDto) return null;
  
  console.log('🔐 [AuthContext] Raw UserDto received:', userDto);
  console.log('🔐 [AuthContext] UserDto user_role field:', userDto.user_role);
  console.log('🔐 [AuthContext] UserDto user_role type:', typeof userDto.user_role);
  
  const mappedUser = {
    id: userDto.id,
    email: userDto.email,
    name: userDto.name || '',
    role: userDto.user_role as UserRole, // Use user_role from actual backend response
    avatar: undefined, // UserDto doesn't have avatar property
    createdAt: userDto.created_at || new Date().toISOString(),
    lastLoginAt: userDto.updated_at || undefined,
  };
  
  console.log('🔐 [AuthContext] Mapped user:', mappedUser);
  console.log('🔐 [AuthContext] User role (backend):', mappedUser.role);
  
  return mappedUser;
};

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  getGoogleLoginUrl: () => Promise<string>;
  handleGoogleCallback: (code: string, state?: string) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Use auth store hooks
  const { user: userDto, isAuthenticated, isLoading: authLoading } = useAuthStatus();
  const { refetch: refetchUserProfile } = useUserProfile();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();
  const googleLoginUrlMutation = useGoogleLoginUrl();
  const googleCallbackMutation = useGoogleLoginCallback();

  // Convert UserDto to User
  const user = mapUserDtoToUser(userDto as unknown as BackendUserDto);

  // Auto-fetch user data when authenticated but user is null
  useEffect(() => {
    if (isAuthenticated && !user && !authLoading) {
      console.log('🔐 [AuthContext] User is authenticated but user data is null, fetching user profile...');
      refetchUserProfile();
    }
  }, [isAuthenticated, user, authLoading, refetchUserProfile]);

  // Handle auth logout events from API client
  useEffect(() => {
    const handleAuthLogout = () => {
      logoutMutation.mutate();
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [logoutMutation]);

  // Clear error when mutations succeed
  useEffect(() => {
    if (loginMutation.isSuccess || logoutMutation.isSuccess) {
      setError(null);
    }
  }, [loginMutation.isSuccess, logoutMutation.isSuccess]);

  const login = async (email: string, password: string): Promise<void> => {
    console.log('🔐 [AuthContext] Starting login process for:', email);
    try {
      setError(null);
      console.log('🔐 [AuthContext] Calling loginMutation.mutateAsync...');
      await loginMutation.mutateAsync({ email_or_phone: email, password });
      console.log('🔐 [AuthContext] Login mutation completed successfully');
      console.log('🔐 [AuthContext] Current auth status after login:', { 
        user: user?.email, 
        isAuthenticated, 
        loading 
      });
    } catch (err) {
      console.error('🔐 [AuthContext] Login failed:', err);
      const parsedError = ErrorHandler.parseError(err);
      const errorMessage = ErrorHandler.getUserMessage(parsedError);
      setError(errorMessage);
      
      // If it's an auth error that requires re-authentication, handle it
      if (requiresReauth(err)) {
        console.log('🔐 [AuthContext] Clearing stored auth data due to reauth requirement');
        // Clear any stored auth data
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
      }
      
      throw new Error(errorMessage);
    }
  };

  const loginWithPhone = async (phone: string, password: string): Promise<void> => {
    try {
      setError(null);
      await loginMutation.mutateAsync({ email_or_phone: phone, password });
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      const errorMessage = ErrorHandler.getUserMessage(parsedError);
      setError(errorMessage);
      
      // If it's an auth error that requires re-authentication, handle it
      if (requiresReauth(err)) {
        // Clear any stored auth data
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await logoutMutation.mutateAsync();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      await forgotPasswordMutation.mutateAsync({ email_or_phone: email });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      setError(null);
      await resetPasswordMutation.mutateAsync({ 
        token, 
        new_password: newPassword,
        confirm_password: newPassword
      });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getGoogleLoginUrl = async (): Promise<string> => {
    try {
      setError(null);
      const response = await googleLoginUrlMutation.refetch();
      if (response.data?.redirect_url) {
        return response.data.redirect_url;
      }
      throw new Error('Failed to get Google login URL');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  };

  const handleGoogleCallback = async (code: string, state?: string): Promise<void> => {
    try {
      setError(null);
      await googleCallbackMutation.mutateAsync({ code, state });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    console.log('🔐 [AuthContext] hasRole check:', {
      requestedRole: role,
      userRole: user?.role,
      userRoleType: typeof user?.role,
      comparison: user?.role === role,
      user: user
    });
    return user?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const clearError = (): void => {
    setError(null);
  };

  const refreshUserData = async (): Promise<void> => {
    try {
      console.log('🔐 [AuthContext] Manually refreshing user data...');
      await refetchUserProfile();
    } catch (error) {
      console.error('🔐 [AuthContext] Failed to refresh user data:', error);
      throw error;
    }
  };
// Combine loading states
  const loading = authLoading || 
    loginMutation.isPending || 
    logoutMutation.isPending || 
    forgotPasswordMutation.isPending || 
    resetPasswordMutation.isPending ||
    googleLoginUrlMutation.isLoading ||
    googleCallbackMutation.isPending;

  const contextValue: AuthContextType = {
    user,
    loading,
    error: error || 
      (loginMutation.error ? getErrorMessage(loginMutation.error) : null) ||
      (logoutMutation.error ? getErrorMessage(logoutMutation.error) : null) ||
      (forgotPasswordMutation.error ? getErrorMessage(forgotPasswordMutation.error) : null) ||
      (resetPasswordMutation.error ? getErrorMessage(resetPasswordMutation.error) : null) ||
      (googleLoginUrlMutation.error ? getErrorMessage(googleLoginUrlMutation.error) : null) ||
      (googleCallbackMutation.error ? getErrorMessage(googleCallbackMutation.error) : null),
    isAuthenticated,
    login,
    loginWithPhone,
    logout,
    forgotPassword,
    resetPassword,
    getGoogleLoginUrl,
    handleGoogleCallback,
    hasRole,
    hasPermission,
    clearError,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};