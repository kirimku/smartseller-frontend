import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  useLogin, 
  useLogout, 
  useAuthStatus, 
  useForgotPassword, 
  useResetPassword,
  useGoogleLoginUrl,
  useGoogleLoginCallback
} from '../stores/auth-store';
import type { UserDto } from '../generated/api/types.gen';
import { getErrorMessage } from '../lib/api-client';
import { ErrorHandler, requiresReauth } from '../lib/error-handler';

export type UserRole = 'platform_admin' | 'tenant_admin' | 'customer' | null;

// Map UserDto to our User interface
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
const mapUserDtoToUser = (userDto: UserDto | null): User | null => {
  if (!userDto) return null;
  
  return {
    id: userDto.id,
    email: userDto.email,
    name: userDto.name || '',
    role: (userDto.role as UserRole) || null,
    avatar: userDto.picture || undefined,
    createdAt: userDto.created_at || new Date().toISOString(),
    lastLoginAt: userDto.updated_at || undefined,
  };
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  
  // Use the auth store hooks
  const { user: userDto, isAuthenticated, isLoading } = useAuthStatus();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();
  const { refetch: fetchGoogleLoginUrl } = useGoogleLoginUrl();
  const googleCallbackMutation = useGoogleLoginCallback();

  // Convert UserDto to User
  const user = mapUserDtoToUser(userDto);

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
    try {
      setError(null);
      await loginMutation.mutateAsync({ email_or_phone: email, password });
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
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
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
      const response = await fetchGoogleLoginUrl();
      if (response.data?.redirect_url) {
        return response.data.redirect_url;
      }
      throw new Error('Failed to get Google login URL');
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
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
    return user?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const clearError = (): void => {
    setError(null);
  };

  const loading = isLoading || 
    loginMutation.isPending || 
    logoutMutation.isPending || 
    forgotPasswordMutation.isPending || 
    resetPasswordMutation.isPending ||
    googleCallbackMutation.isPending;

  const contextValue: AuthContextType = {
    user,
    loading,
    error: error || 
      (loginMutation.error ? getErrorMessage(loginMutation.error) : null) ||
      (logoutMutation.error ? getErrorMessage(logoutMutation.error) : null) ||
      (forgotPasswordMutation.error ? getErrorMessage(forgotPasswordMutation.error) : null) ||
      (resetPasswordMutation.error ? getErrorMessage(resetPasswordMutation.error) : null) ||
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