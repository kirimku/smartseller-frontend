/**
 * Session Context
 * 
 * Provides session management functionality throughout the React application
 * including timeout handling, warnings, and concurrent session management.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  sessionManager, 
  SessionManager, 
  SessionInfo, 
  SessionConfig, 
  SessionEventHandlers 
} from '../lib/security/session-manager';

export interface SessionContextType {
  sessionInfo: SessionInfo | null;
  isSessionWarningVisible: boolean;
  isConcurrentSessionWarningVisible: boolean;
  timeRemaining: number;
  concurrentSessionCount: number;
  extendSession: () => Promise<boolean>;
  dismissWarning: () => void;
  handleConcurrentSessionContinue: () => void;
  handleConcurrentSessionLogoutOthers: () => Promise<void>;
  handleConcurrentSessionLogoutAll: () => Promise<void>;
  updateSessionConfig: (config: Partial<SessionConfig>) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export interface SessionProviderProps {
  children: ReactNode;
  config?: Partial<SessionConfig>;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const { isAuthenticated, logout } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isSessionWarningVisible, setIsSessionWarningVisible] = useState(false);
  const [isConcurrentSessionWarningVisible, setIsConcurrentSessionWarningVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [concurrentSessionCount, setConcurrentSessionCount] = useState(0);

  // Initialize session manager when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const handlers: SessionEventHandlers = {
        onWarning: (timeRemaining: number) => {
          setTimeRemaining(timeRemaining);
          setIsSessionWarningVisible(true);
        },
        onTimeout: () => {
          setIsSessionWarningVisible(false);
          logout();
        },
        onConcurrentSession: (sessionCount: number) => {
          setConcurrentSessionCount(sessionCount);
          setIsConcurrentSessionWarningVisible(true);
        },
        onSessionExtended: () => {
          setIsSessionWarningVisible(false);
          setTimeRemaining(0);
        },
        onActivityDetected: () => {
          // Update session info when activity is detected
          const currentSessionInfo = sessionManager.getSessionInfo();
          if (currentSessionInfo) {
            setSessionInfo({ ...currentSessionInfo });
          }
        },
      };

      // Update session manager configuration and handlers
      sessionManager.updateConfig({
        timeoutMinutes: 30,
        warningMinutes: 5,
        checkIntervalSeconds: 30,
        maxConcurrentSessions: 3,
        trackActivity: true,
        autoExtendOnActivity: false,
        ...config,
      });

      sessionManager.updateHandlers(handlers);

      // Initialize session monitoring
      sessionManager.initialize().then(() => {
        const currentSessionInfo = sessionManager.getSessionInfo();
        setSessionInfo(currentSessionInfo);
      });

      // Set up periodic session info updates
      const updateInterval = setInterval(() => {
        const currentSessionInfo = sessionManager.getSessionInfo();
        setSessionInfo(currentSessionInfo);
      }, 5000); // Update every 5 seconds

      return () => {
        clearInterval(updateInterval);
      };
    } else {
      // Clean up when user is not authenticated
      sessionManager.destroy();
      setSessionInfo(null);
      setIsSessionWarningVisible(false);
      setIsConcurrentSessionWarningVisible(false);
      setTimeRemaining(0);
      setConcurrentSessionCount(0);
    }
  }, [isAuthenticated, logout, config]);

  // Update countdown timer for session warning
  useEffect(() => {
    if (isSessionWarningVisible && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsSessionWarningVisible(false);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isSessionWarningVisible, timeRemaining, logout]);

  const extendSession = async (): Promise<boolean> => {
    const success = await sessionManager.extendSession();
    if (success) {
      setIsSessionWarningVisible(false);
      setTimeRemaining(0);
    }
    return success;
  };

  const dismissWarning = (): void => {
    setIsSessionWarningVisible(false);
    setTimeRemaining(0);
  };

  const handleConcurrentSessionContinue = (): void => {
    setIsConcurrentSessionWarningVisible(false);
  };

  const handleConcurrentSessionLogoutOthers = async (): Promise<void> => {
    await sessionManager.logoutOtherSessions();
    setIsConcurrentSessionWarningVisible(false);
    setConcurrentSessionCount(1);
  };

  const handleConcurrentSessionLogoutAll = async (): Promise<void> => {
    await sessionManager.logoutAllSessions();
    setIsConcurrentSessionWarningVisible(false);
    logout();
  };

  const updateSessionConfig = (newConfig: Partial<SessionConfig>): void => {
    sessionManager.updateConfig(newConfig);
  };

  const contextValue: SessionContextType = {
    sessionInfo,
    isSessionWarningVisible,
    isConcurrentSessionWarningVisible,
    timeRemaining,
    concurrentSessionCount,
    extendSession,
    dismissWarning,
    handleConcurrentSessionContinue,
    handleConcurrentSessionLogoutOthers,
    handleConcurrentSessionLogoutAll,
    updateSessionConfig,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

// Higher-order component for session management
export const withSessionManagement = <P extends object>(
  Component: React.ComponentType<P>,
  sessionConfig?: Partial<SessionConfig>
) => {
  const SessionManagedComponent = (props: P) => (
    <SessionProvider config={sessionConfig}>
      <Component {...props} />
    </SessionProvider>
  );

  SessionManagedComponent.displayName = `withSessionManagement(${Component.displayName || Component.name})`;
  return SessionManagedComponent;
};