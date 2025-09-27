import React, { useState, useCallback, useRef } from 'react';

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number; // 0-100 for progress indicators
}

export interface AsyncOperation<T> {
  execute: () => Promise<T>;
  loadingMessage?: string;
  onSuccess?: (result: T) => void;
  onError?: (error: unknown) => void;
  onFinally?: () => void;
}

/**
 * Hook for managing loading states with multiple concurrent operations
 */
export function useLoadingManager() {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(new Map());
  const operationCountRef = useRef(0);

  const startLoading = useCallback((key: string, message?: string, progress?: number) => {
    setLoadingStates(prev => new Map(prev.set(key, {
      isLoading: true,
      loadingMessage: message,
      progress,
    })));
  }, []);

  const updateProgress = useCallback((key: string, progress: number, message?: string) => {
    setLoadingStates(prev => {
      const current = prev.get(key);
      if (current) {
        return new Map(prev.set(key, {
          ...current,
          progress,
          loadingMessage: message || current.loadingMessage,
        }));
      }
      return prev;
    });
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates.get(key)?.isLoading || false;
    }
    return Array.from(loadingStates.values()).some(state => state.isLoading);
  }, [loadingStates]);

  const getLoadingState = useCallback((key: string) => {
    return loadingStates.get(key);
  }, [loadingStates]);

  const getAllLoadingStates = useCallback(() => {
    return Array.from(loadingStates.entries()).map(([key, state]) => ({
      key,
      ...state,
    }));
  }, [loadingStates]);

  const executeAsync = useCallback(async <T>(
    operation: AsyncOperation<T>,
    key?: string
  ): Promise<T> => {
    const operationKey = key || `operation_${++operationCountRef.current}`;
    
    try {
      startLoading(operationKey, operation.loadingMessage);
      const result = await operation.execute();
      operation.onSuccess?.(result);
      return result;
    } catch (error) {
      operation.onError?.(error);
      throw error;
    } finally {
      stopLoading(operationKey);
      operation.onFinally?.();
    }
  }, [startLoading, stopLoading]);

  const clearAllLoading = useCallback(() => {
    setLoadingStates(new Map());
  }, []);

  return {
    startLoading,
    stopLoading,
    updateProgress,
    isLoading,
    getLoadingState,
    getAllLoadingStates,
    executeAsync,
    clearAllLoading,
  };
}

/**
 * Simple loading hook for single operations
 */
export function useSimpleLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingMessage, setLoadingMessage] = useState<string>();

  const startLoading = useCallback((message?: string) => {
    setIsLoading(true);
    setLoadingMessage(message);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(undefined);
  }, []);

  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    try {
      startLoading(message);
      return await operation();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    executeAsync,
  };
}

/**
 * Loading state constants for common operations
 */
export const LoadingMessages = {
  // Authentication
  LOGGING_IN: 'Signing in...',
  LOGGING_OUT: 'Signing out...',
  REFRESHING_TOKEN: 'Refreshing session...',
  RESETTING_PASSWORD: 'Resetting password...',
  SENDING_RESET_EMAIL: 'Sending reset email...',
  
  // Data operations
  LOADING_DATA: 'Loading data...',
  SAVING_DATA: 'Saving...',
  UPDATING_DATA: 'Updating...',
  DELETING_DATA: 'Deleting...',
  
  // File operations
  UPLOADING_FILE: 'Uploading file...',
  DOWNLOADING_FILE: 'Downloading file...',
  PROCESSING_FILE: 'Processing file...',
  
  // API operations
  FETCHING_USERS: 'Loading users...',
  FETCHING_ORDERS: 'Loading orders...',
  FETCHING_PRODUCTS: 'Loading products...',
  CREATING_ORDER: 'Creating order...',
  UPDATING_ORDER: 'Updating order...',
  
  // Generic
  PROCESSING: 'Processing...',
  PLEASE_WAIT: 'Please wait...',
} as const;

/**
 * Utility function to create loading keys for consistent naming
 */
export const LoadingKeys = {
  auth: (action: string) => `auth_${action}`,
  api: (endpoint: string, method: string) => `api_${endpoint}_${method}`,
  form: (formName: string) => `form_${formName}`,
  file: (operation: string) => `file_${operation}`,
  custom: (key: string) => key,
} as const;

/**
 * Higher-order component for adding loading states to components
 */
export function withLoading<T extends object>(
  Component: React.ComponentType<T>,
  loadingComponent?: React.ComponentType<{ message?: string }>
) {
  return function LoadingWrapper(props: T & { isLoading?: boolean; loadingMessage?: string }) {
    const { isLoading, loadingMessage, ...componentProps } = props;
    
    if (isLoading) {
      const LoadingComponent = loadingComponent || DefaultLoadingComponent;
      return <LoadingComponent message={loadingMessage} />;
    }
    
    return <Component {...(componentProps as T)} />;
  };
}

/**
 * Default loading component
 */
function DefaultLoadingComponent({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      {message && <span className="ml-2 text-gray-600">{message}</span>}
    </div>
  );
}