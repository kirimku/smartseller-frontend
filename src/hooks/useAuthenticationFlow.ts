/**
 * Comprehensive Authentication Flow Hook
 * 
 * Provides a unified interface for all authentication operations including:
 * - Login/logout with multiple methods
 * - Password management
 * - Session management
 * - Error handling and recovery
 * - Loading states
 * - Security features
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth, type User, type UserRole } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { enhancedApiClient } from '../lib/security/enhanced-api-client';
import { ErrorHandler } from '../lib/error-handler';

export interface AuthenticationState {
  isLoading: boolean;
  isAuthenticating: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastError: Error | null;
  retryCount: number;
  canRetry: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  captchaToken?: string;
}

export interface PhoneLoginCredentials {
  phone: string;
  password: string;
  rememberMe?: boolean;
  captchaToken?: string;
}

export interface PasswordResetData {
  email: string;
  captchaToken?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthenticationFlowResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  requiresVerification?: boolean;
  requiresCaptcha?: boolean;
  retryAfter?: number;
}

export interface UseAuthenticationFlowReturn {
  // State
  state: AuthenticationState;
  user: User | null;
  isAuthenticated: boolean;
  
  // Authentication methods
  loginWithEmail: (credentials: LoginCredentials) => Promise<AuthenticationFlowResult>;
  loginWithPhone: (credentials: PhoneLoginCredentials) => Promise<AuthenticationFlowResult>;
  loginWithGoogle: () => Promise<AuthenticationFlowResult<string>>;
  logout: () => Promise<AuthenticationFlowResult>;
  
  // Password management
  forgotPassword: (data: PasswordResetData) => Promise<AuthenticationFlowResult>;
  resetPassword: (token: string, newPassword: string) => Promise<AuthenticationFlowResult>;
  changePassword: (data: PasswordChangeData) => Promise<AuthenticationFlowResult>;
  
  // Session management
  refreshSession: () => Promise<AuthenticationFlowResult>;
  validateSession: () => Promise<AuthenticationFlowResult<boolean>>;
  extendSession: () => Promise<AuthenticationFlowResult>;
  
  // Error handling
  clearError: () => void;
  retry: () => Promise<AuthenticationFlowResult>;
  
  // Utility methods
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  getAuthHeaders: () => Record<string, string>;
  
  // Security features
  checkSecurityStatus: () => Promise<AuthenticationFlowResult<{
    hasSecureConnection: boolean;
    tokenExpiry: Date | null;
    lastActivity: Date;
    concurrentSessions: number;
  }>>;
}

export const useAuthenticationFlow = (): UseAuthenticationFlowReturn => {
  const auth = useAuth();
  const session = useSession();
  
  const [state, setState] = useState<AuthenticationState>({
    isLoading: false,
    isAuthenticating: false,
    isRefreshing: false,
    error: null,
    lastError: null,
    retryCount: 0,
    canRetry: true,
  });

  const [lastOperation, setLastOperation] = useState<(() => Promise<AuthenticationFlowResult>) | null>(null);

  // Update loading state based on auth context
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isLoading: auth.loading,
      error: auth.error,
    }));
  }, [auth.loading, auth.error]);

  // Helper function to handle operation execution with enhanced error handling
  const executeWithErrorHandling = async <T = void>(
    operation: () => Promise<T>,
    context: string
  ): Promise<AuthenticationFlowResult<T>> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastError: null,
    }));

    try {
      const result = await operation();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        retryCount: 0,
        canRetry: true,
      }));

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const parsedError = ErrorHandler.parseError(error);
      const errorMessage = ErrorHandler.getUserMessage(parsedError);
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        lastError: errorObj,
        retryCount: prev.retryCount + 1,
        canRetry: prev.retryCount < 3,
      }));

      return {
        success: false,
        error: errorMessage,
        requiresVerification: errorMessage.includes('verification'),
        requiresCaptcha: errorMessage.includes('captcha') || errorMessage.includes('bot'),
        retryAfter: errorMessage.includes('rate limit') ? 60 : undefined,
      };
    }
  };

  // Helper function to handle operation execution
  const executeOperation = useCallback(async <T = void>(
    operation: () => Promise<T>,
    operationType: 'authenticating' | 'refreshing' | 'loading',
    retryable: boolean = true
  ): Promise<AuthenticationFlowResult<T>> => {
    setState(prev => ({
      ...prev,
      [operationType === 'authenticating' ? 'isAuthenticating' : 
       operationType === 'refreshing' ? 'isRefreshing' : 'isLoading']: true,
      error: null,
      lastError: null,
    }));

    try {
      const result = await operation();
      
      setState(prev => ({
        ...prev,
        [operationType === 'authenticating' ? 'isAuthenticating' : 
         operationType === 'refreshing' ? 'isRefreshing' : 'isLoading']: false,
        retryCount: 0,
        canRetry: true,
      }));

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const parsedError = ErrorHandler.parseError(error);
      const errorMessage = ErrorHandler.getUserMessage(parsedError);
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      
      setState(prev => ({
        ...prev,
        [operationType === 'authenticating' ? 'isAuthenticating' : 
         operationType === 'refreshing' ? 'isRefreshing' : 'isLoading']: false,
        error: errorMessage,
        lastError: errorObj,
        retryCount: prev.retryCount + 1,
        canRetry: retryable && prev.retryCount < 3,
      }));

      // Store operation for retry if retryable
      if (retryable) {
        setLastOperation(() => () => executeOperation(operation, operationType, retryable));
      }

      return {
        success: false,
        error: errorMessage,
        requiresVerification: errorMessage.includes('verification'),
        requiresCaptcha: errorMessage.includes('captcha') || errorMessage.includes('bot'),
        retryAfter: errorMessage.includes('rate limit') ? 60 : undefined,
      };
    }
  }, []);

  // Authentication methods
  const loginWithEmail = useCallback(async (credentials: LoginCredentials): Promise<AuthenticationFlowResult> => {
    return executeOperation(async () => {
      await auth.login(credentials.email, credentials.password);
      
      // Set remember me preference if specified
      if (credentials.rememberMe) {
        localStorage.setItem('smartseller_remember_me', 'true');
      }
    }, 'authenticating');
  }, [auth, executeOperation]);

  const loginWithPhone = useCallback(async (credentials: PhoneLoginCredentials): Promise<AuthenticationFlowResult> => {
    return executeOperation(async () => {
      await auth.loginWithPhone(credentials.phone, credentials.password);
      
      if (credentials.rememberMe) {
        localStorage.setItem('smartseller_remember_me', 'true');
      }
    }, 'authenticating');
  }, [auth, executeOperation]);

  const loginWithGoogle = useCallback(async (): Promise<AuthenticationFlowResult<string>> => {
    return executeOperation(async () => {
      const googleUrl = await auth.getGoogleLoginUrl();
      return googleUrl;
    }, 'authenticating');
  }, [auth, executeOperation]);

  const logout = useCallback(async (): Promise<AuthenticationFlowResult> => {
    return executeOperation(async () => {
      await auth.logout();
      localStorage.removeItem('smartseller_remember_me');
    }, 'loading', false);
  }, [auth, executeOperation]);

  // Password management
  const forgotPassword = useCallback(async (data: PasswordResetData): Promise<AuthenticationFlowResult> => {
    return executeOperation(async () => {
      await auth.forgotPassword(data.email);
    }, 'loading');
  }, [auth, executeOperation]);

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<AuthenticationFlowResult> => {
    return executeOperation(async () => {
      await auth.resetPassword(token, newPassword);
    }, 'loading');
  }, [auth, executeOperation]);

  const changePassword = useCallback(async (data: PasswordChangeData): Promise<AuthenticationFlowResult> => {
    return executeOperation(async () => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      if (data.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      // This would be implemented when the API supports password change
      throw new Error('Password change not yet implemented in API');
    }, 'loading');
  }, [executeOperation]);

  // Session management
  const refreshSession = useCallback(async (): Promise<AuthenticationFlowResult> => {
    return executeOperation(async () => {
      await enhancedApiClient.manualRefresh();
    }, 'refreshing');
  }, [executeOperation]);

  const validateSession = useCallback(async (): Promise<AuthenticationFlowResult<boolean>> => {
    return executeOperation(async () => {
      const authStatus = await enhancedApiClient.getAuthStatus();
      return authStatus.isAuthenticated;
    }, 'loading', false);
  }, [executeOperation]);

  const extendSession = useCallback(async (): Promise<AuthenticationFlowResult> => {
    return executeOperation(async () => {
      const success = await session.extendSession();
      if (!success) {
        throw new Error('Failed to extend session');
      }
    }, 'refreshing');
  }, [session, executeOperation]);

  // Error handling
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      lastError: null,
      retryCount: 0,
      canRetry: true,
    }));
    auth.clearError();
  }, [auth]);

  const retry = useCallback(async (): Promise<AuthenticationFlowResult> => {
    if (!lastOperation || !state.canRetry) {
      return {
        success: false,
        error: 'No operation to retry or retry limit exceeded',
      };
    }

    return lastOperation();
  }, [lastOperation, state.canRetry]);

  // Utility methods
  const hasRole = useCallback((role: UserRole): boolean => {
    return auth.hasRole(role);
  }, [auth]);

  const hasPermission = useCallback((permission: string): boolean => {
    return auth.hasPermission(permission);
  }, [auth]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    
    // Add CSRF token if available
    const csrfToken = localStorage.getItem('smartseller_csrf_token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    return headers;
  }, []);

  // Security features
  const checkSecurityStatus = useCallback(async (): Promise<AuthenticationFlowResult<{
    hasSecureConnection: boolean;
    tokenExpiry: Date | null;
    lastActivity: Date;
    concurrentSessions: number;
  }>> => {
    return executeOperation(async () => {
      const authStatus = await enhancedApiClient.getAuthStatus();
      const sessionInfo = session.sessionInfo;
      
      return {
        hasSecureConnection: window.location.protocol === 'https:',
        tokenExpiry: authStatus.tokenExpiry,
        lastActivity: sessionInfo?.lastActivity || new Date(),
        concurrentSessions: sessionInfo?.concurrentSessions || 1,
      };
    }, 'loading', false);
  }, [session, executeOperation]);

  return {
    // State
    state,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    
    // Authentication methods
    loginWithEmail,
    loginWithPhone,
    loginWithGoogle,
    logout,
    
    // Password management
    forgotPassword,
    resetPassword,
    changePassword,
    
    // Session management
    refreshSession,
    validateSession,
    extendSession,
    
    // Error handling
    clearError,
    retry,
    
    // Utility methods
    hasRole,
    hasPermission,
    getAuthHeaders,
    
    // Security features
    checkSecurityStatus,
  };
};

export default useAuthenticationFlow;