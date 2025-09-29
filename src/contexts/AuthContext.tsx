import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { enhancedApiClient, getErrorMessage } from '../lib/security/enhanced-api-client';
import { SecureTokenManager } from '../lib/security/secure-token-manager';
import { ErrorHandler, requiresReauth } from '../lib/error-handler';
import { useQueryClient } from '@tanstack/react-query';

export type UserRole = 'admin' | 'user' | 'manager' | null;

// API response interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Backend user DTO interface
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

// Frontend user interface
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

// Map backend DTO to frontend interface
const mapUserDtoToUser = (userDto: BackendUserDto | null): User | null => {
  if (!userDto) return null;

  let role: UserRole = 'user';
  if (userDto.is_admin) {
    role = 'admin';
  } else if (userDto.user_role === 'manager') {
    role = 'manager';
  }

  return {
    id: userDto.id,
    email: userDto.email,
    name: userDto.name,
    role,
    avatar: userDto.picture,
    permissions: userDto.is_admin ? ['admin'] : [],
    createdAt: userDto.created_at,
    lastLoginAt: userDto.updated_at,
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
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  // Fetch user profile data
  const fetchUserProfile = async (): Promise<User | null> => {
    try {
      const response = await enhancedApiClient.getClient().get({
        url: '/api/v1/users/me'
      });
      
      const responseData = response.data as ApiResponse<BackendUserDto>;
      if (responseData && responseData.success && responseData.data) {
        return mapUserDtoToUser(responseData.data);
      }
      return null;
    } catch (error) {
      console.error('🔐 [AuthContext] Failed to fetch user profile:', error);
      return null;
    }
  };

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        await enhancedApiClient.initialize();
        const isAuth = await enhancedApiClient.isAuthenticated();
        setIsAuthenticated(isAuth);
        
        if (isAuth) {
          const userData = await fetchUserProfile();
          setUser(userData);
        }
      } catch (err) {
        console.error('🔐 [AuthContext] Failed to initialize auth:', err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Handle auth logout events from API client
  useEffect(() => {
    const handleAuthLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
      queryClient.clear();
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [queryClient]);

  const login = async (email: string, password: string): Promise<void> => {
    console.log('🔐 [AuthContext] Starting login process for:', email);
    try {
      setError(null);
      setLoading(true);
      
      const success = await enhancedApiClient.login({ email_or_phone: email, password });
      
      if (success) {
        setIsAuthenticated(true);
        const userData = await fetchUserProfile();
        setUser(userData);
        console.log('🔐 [AuthContext] Login completed successfully');
      } else {
        throw new Error('Login failed');
      }
    } catch (err) {
      console.error('🔐 [AuthContext] Login failed:', err);
      const parsedError = ErrorHandler.parseError(err);
      const errorMessage = ErrorHandler.getUserMessage(parsedError);
      setError(errorMessage);
      
      // If it's an auth error that requires re-authentication, handle it
      if (requiresReauth(err)) {
        console.log('🔐 [AuthContext] Clearing stored auth data due to reauth requirement');
        await SecureTokenManager.clearTokens();
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loginWithPhone = async (phone: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      
      const success = await enhancedApiClient.login({ email_or_phone: phone, password });
      
      if (success) {
        setIsAuthenticated(true);
        const userData = await fetchUserProfile();
        setUser(userData);
      } else {
        throw new Error('Login failed');
      }
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      const errorMessage = ErrorHandler.getUserMessage(parsedError);
      setError(errorMessage);
      
      // If it's an auth error that requires re-authentication, handle it
      if (requiresReauth(err)) {
        await SecureTokenManager.clearTokens();
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await enhancedApiClient.logout();
      setIsAuthenticated(false);
      setUser(null);
      queryClient.clear();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      // Even if logout fails, clear local state
      setIsAuthenticated(false);
      setUser(null);
      queryClient.clear();
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      
      await enhancedApiClient.getClient().post({
        url: '/api/v1/auth/forgot-password',
        body: { email_or_phone: email }
      });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      
      await enhancedApiClient.getClient().post({
        url: '/api/v1/auth/reset-password',
        body: { 
          token, 
          new_password: newPassword,
          confirm_password: newPassword
        }
      });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
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
      setLoading(true);
      const userData = await fetchUserProfile();
      setUser(userData);
    } catch (error) {
      console.error('🔐 [AuthContext] Failed to refresh user data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    loginWithPhone,
    logout,
    forgotPassword,
    resetPassword,
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