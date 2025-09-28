/**
 * RouteGuard Component
 * 
 * Advanced route protection with tenant-specific access control, 
 * session validation, and security features including:
 * - Tenant-specific access control
 * - Session timeout detection
 * - Concurrent session management
 * - IP-based restrictions (future)
 * - Time-based access control (future)
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type User } from '../../contexts/AuthContext';
import { enhancedApiClient } from '../../lib/security/enhanced-api-client';
import { Loader2, Shield, Clock, Users, AlertTriangle, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';

export interface RouteGuardProps {
  children: React.ReactNode;
  tenantId?: string;
  requiredTenantRole?: 'owner' | 'admin' | 'member';
  allowedTenants?: string[];
  deniedTenants?: string[];
  maxConcurrentSessions?: number;
  sessionTimeoutMinutes?: number;
  requireActiveSession?: boolean;
  allowedTimeRange?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone?: string;
  };
  allowedDays?: number[]; // 0-6, Sunday = 0
  customTenantCheck?: (user: User, tenantId?: string) => boolean;
  onSessionTimeout?: () => void;
  onConcurrentSessionDetected?: () => void;
  onUnauthorizedAccess?: (reason: string) => void;
}

interface SessionInfo {
  isValid: boolean;
  expiresAt: Date | null;
  concurrentSessions: number;
  lastActivity: Date;
}

/**
 * Session validation loading component
 */
const SessionValidationLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Shield className="h-12 w-12 text-green-500" />
            <Loader2 className="h-6 w-6 text-green-600 animate-spin absolute -top-1 -right-1" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Validating Session
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Checking session security and tenant access...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * Session timeout warning component
 */
const SessionTimeoutWarning: React.FC<{
  timeRemaining: number;
  onExtendSession: () => void;
  onLogout: () => void;
}> = ({ timeRemaining, onExtendSession, onLogout }) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Session Expiring Soon
          </CardTitle>
          <CardDescription>
            Your session will expire in{' '}
            <Badge variant="outline" className="font-mono">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              To continue working, please extend your session or you will be automatically logged out.
            </AlertDescription>
          </Alert>
          
          <div className="flex space-x-2">
            <Button onClick={onExtendSession} className="flex-1">
              <Wifi className="mr-2 h-4 w-4" />
              Extend Session
            </Button>
            <Button onClick={onLogout} variant="outline" className="flex-1">
              Logout Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Concurrent session detected component
 */
const ConcurrentSessionDetected: React.FC<{
  sessionCount: number;
  onContinue: () => void;
  onLogoutOthers: () => void;
  onLogoutAll: () => void;
}> = ({ sessionCount, onContinue, onLogoutOthers, onLogoutAll }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <Card className="w-full max-w-md mx-4">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
          <Users className="h-6 w-6 text-orange-600" />
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Multiple Sessions Detected
        </CardTitle>
        <CardDescription>
          You have {sessionCount} active sessions. For security, you may want to review your active sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            If you didn't authorize these sessions, please logout all sessions and change your password.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Button onClick={onContinue} variant="outline" className="w-full">
            Continue with Current Session
          </Button>
          <Button onClick={onLogoutOthers} variant="secondary" className="w-full">
            Logout Other Sessions
          </Button>
          <Button onClick={onLogoutAll} variant="destructive" className="w-full">
            Logout All Sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * RouteGuard Component
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  tenantId,
  requiredTenantRole,
  allowedTenants = [],
  deniedTenants = [],
  maxConcurrentSessions = 5,
  sessionTimeoutMinutes = 30,
  requireActiveSession = true,
  allowedTimeRange,
  allowedDays,
  customTenantCheck,
  onSessionTimeout,
  onConcurrentSessionDetected,
  onUnauthorizedAccess,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [showConcurrentWarning, setShowConcurrentWarning] = useState(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState(0);

  // Validate session and check security
  useEffect(() => {
    const validateSession = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        const authStatus = await enhancedApiClient.getAuthStatus();
        
        const sessionInfo: SessionInfo = {
          isValid: authStatus.isAuthenticated,
          expiresAt: authStatus.tokenExpiry,
          concurrentSessions: 1, // This would come from backend
          lastActivity: new Date(),
        };

        setSessionInfo(sessionInfo);

        // Check concurrent sessions
        if (sessionInfo.concurrentSessions > maxConcurrentSessions) {
          setShowConcurrentWarning(true);
          onConcurrentSessionDetected?.();
        }

        // Setup session timeout warning
        if (sessionInfo.expiresAt && sessionTimeoutMinutes > 0) {
          const timeUntilExpiry = sessionInfo.expiresAt.getTime() - Date.now();
          const warningTime = 5 * 60 * 1000; // 5 minutes before expiry
          
          if (timeUntilExpiry <= warningTime && timeUntilExpiry > 0) {
            setTimeoutCountdown(Math.floor(timeUntilExpiry / 1000));
            setShowTimeoutWarning(true);
          }
        }

      } catch (error) {
        console.error('Session validation failed:', error);
        setSessionInfo({
          isValid: false,
          expiresAt: null,
          concurrentSessions: 0,
          lastActivity: new Date(),
        });
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, [isAuthenticated, user, maxConcurrentSessions, sessionTimeoutMinutes, onConcurrentSessionDetected]);

  // Countdown timer for session timeout
  useEffect(() => {
    if (showTimeoutWarning && timeoutCountdown > 0) {
      const timer = setInterval(() => {
        setTimeoutCountdown(prev => {
          if (prev <= 1) {
            setShowTimeoutWarning(false);
            onSessionTimeout?.();
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showTimeoutWarning, timeoutCountdown, onSessionTimeout, logout]);

  // Check time-based access
  const checkTimeAccess = (): boolean => {
    if (!allowedTimeRange) return true;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    return currentTime >= allowedTimeRange.start && currentTime <= allowedTimeRange.end;
  };

  // Check day-based access
  const checkDayAccess = (): boolean => {
    if (!allowedDays || allowedDays.length === 0) return true;

    const today = new Date().getDay();
    return allowedDays.includes(today);
  };

  // Show loading state
  if (loading) {
    return <SessionValidationLoading />;
  }

  // Check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/platform/login" state={{ from: location.pathname }} replace />;
  }

  // Check session validity
  if (requireActiveSession && sessionInfo && !sessionInfo.isValid) {
    onUnauthorizedAccess?.('Invalid session');
    return <Navigate to="/platform/login" state={{ from: location.pathname }} replace />;
  }

  // Check tenant access
  if (tenantId && user.tenantId !== tenantId) {
    onUnauthorizedAccess?.(`Access denied for tenant ${tenantId}`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Check allowed tenants
  if (allowedTenants.length > 0 && user.tenantId && !allowedTenants.includes(user.tenantId)) {
    onUnauthorizedAccess?.('Tenant not in allowed list');
    return <Navigate to="/unauthorized" replace />;
  }

  // Check denied tenants
  if (deniedTenants.length > 0 && user.tenantId && deniedTenants.includes(user.tenantId)) {
    onUnauthorizedAccess?.('Tenant access denied');
    return <Navigate to="/unauthorized" replace />;
  }

  // Check time-based access
  if (!checkTimeAccess()) {
    onUnauthorizedAccess?.('Access not allowed at this time');
    return <Navigate to="/unauthorized" replace />;
  }

  // Check day-based access
  if (!checkDayAccess()) {
    onUnauthorizedAccess?.('Access not allowed on this day');
    return <Navigate to="/unauthorized" replace />;
  }

  // Custom tenant check
  if (customTenantCheck && !customTenantCheck(user, tenantId)) {
    onUnauthorizedAccess?.('Custom tenant check failed');
    return <Navigate to="/unauthorized" replace />;
  }

  // Handle session timeout warning
  const handleExtendSession = async () => {
    try {
      await enhancedApiClient.manualRefresh();
      setShowTimeoutWarning(false);
      setTimeoutCountdown(0);
    } catch (error) {
      console.error('Failed to extend session:', error);
      logout();
    }
  };

  // Handle concurrent session actions
  const handleContinueSession = () => {
    setShowConcurrentWarning(false);
  };

  const handleLogoutOthers = async () => {
    // This would call an API to logout other sessions
    console.log('Logout other sessions - API call needed');
    setShowConcurrentWarning(false);
  };

  const handleLogoutAll = async () => {
    await logout();
  };

  return (
    <>
      {children}
      
      {/* Session timeout warning overlay */}
      {showTimeoutWarning && (
        <SessionTimeoutWarning
          timeRemaining={timeoutCountdown}
          onExtendSession={handleExtendSession}
          onLogout={logout}
        />
      )}

      {/* Concurrent session warning overlay */}
      {showConcurrentWarning && sessionInfo && (
        <ConcurrentSessionDetected
          sessionCount={sessionInfo.concurrentSessions}
          onContinue={handleContinueSession}
          onLogoutOthers={handleLogoutOthers}
          onLogoutAll={handleLogoutAll}
        />
      )}
    </>
  );
};

/**
 * Higher-order component for route guarding
 */
export const withRouteGuard = <P extends object>(
  Component: React.ComponentType<P>,
  guardConfig: Omit<RouteGuardProps, 'children'>
) => {
  const GuardedComponent = (props: P) => (
    <RouteGuard {...guardConfig}>
      <Component {...props} />
    </RouteGuard>
  );

  GuardedComponent.displayName = `withRouteGuard(${Component.displayName || Component.name})`;
  return GuardedComponent;
};

export default RouteGuard;