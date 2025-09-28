/**
 * ProtectedRoute Component
 * 
 * Provides route-level authentication and authorization protection with:
 * - Authentication verification
 * - Role-based access control
 * - Permission-based access control
 * - Tenant-specific access control
 * - Proper loading states and error handling
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole, type User } from '../../contexts/AuthContext';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  requireTenant?: boolean;
  fallbackPath?: string;
  fallback?: React.ReactNode;
  allowedRoles?: UserRole[];
  deniedRoles?: UserRole[];
  customAccessCheck?: (user: User) => boolean;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

/**
 * Loading component for route protection
 */
const RouteLoading: React.FC<{ message?: string }> = ({ 
  message = "Verifying access..." 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Shield className="h-12 w-12 text-blue-500" />
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin absolute -top-1 -right-1" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Checking Access
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * Unauthorized access component
 */
const UnauthorizedAccess: React.FC<{ 
  reason?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}> = ({ 
  reason = "You don't have permission to access this page.",
  onRetry,
  onGoBack
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Access Denied
        </CardTitle>
        <CardDescription className="text-gray-600">
          {reason}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            If you believe this is an error, please contact your administrator or try logging in again.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col space-y-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="w-full">
              <Loader2 className="mr-2 h-4 w-4" />
              Retry Access Check
            </Button>
          )}
          {onGoBack && (
            <Button onClick={onGoBack} variant="secondary" className="w-full">
              Go Back
            </Button>
          )}
          <Button 
            onClick={() => window.location.href = '/login'} 
            className="w-full"
          >
            Go to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * ProtectedRoute Component
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles = [],
  requiredPermissions = [],
  requireTenant = false,
  fallbackPath = '/login',
  fallback,
  allowedRoles = [],
  deniedRoles = [],
  customAccessCheck,
  loadingComponent,
  unauthorizedComponent,
}) => {
  const { user, loading, isAuthenticated, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  console.log('🛡️ [ProtectedRoute] Checking access for path:', location.pathname);
  console.log('🛡️ [ProtectedRoute] Auth state:', {
    user: user?.email || 'null',
    loading,
    isAuthenticated,
    userRole: user?.role || 'null',
    requiredRole,
    requiredRoles,
    fallbackPath
  });

  // Show loading state
  if (loading) {
    console.log('🛡️ [ProtectedRoute] Showing loading state');
    return loadingComponent || <RouteLoading />;
  }

  // Check authentication
  if (!isAuthenticated) {
    console.log('🛡️ [ProtectedRoute] User not authenticated, redirecting to:', fallbackPath);
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname, returnUrl: location.pathname + location.search }} 
        replace 
      />
    );
  }

  // User is authenticated but no user data
  if (!user) {
    return (
      <RouteLoading message="Loading user profile..." />
    );
  }

  // Check denied roles first
  if (deniedRoles.length > 0 && deniedRoles.some(role => hasRole(role))) {
    const reason = `Access denied for ${user.role} role.`;
    return unauthorizedComponent || <UnauthorizedAccess reason={reason} />;
  }

  // Check specific required role
  if (requiredRole && !hasRole(requiredRole)) {
    const reason = `This page requires ${requiredRole} role. You have ${user.role} role.`;
    return unauthorizedComponent || <UnauthorizedAccess reason={reason} />;
  }

  // Check multiple required roles (user must have at least one)
  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    const rolesList = requiredRoles.join(', ');
    const reason = `This page requires one of these roles: ${rolesList}. You have ${user.role} role.`;
    return unauthorizedComponent || <UnauthorizedAccess reason={reason} />;
  }

  // Check allowed roles (if specified, user must have one of them)
  if (allowedRoles.length > 0 && !allowedRoles.some(role => hasRole(role))) {
    const rolesList = allowedRoles.join(', ');
    const reason = `Access restricted to: ${rolesList}. You have ${user.role} role.`;
    return unauthorizedComponent || <UnauthorizedAccess reason={reason} />;
  }

  // Check required permissions
  if (requiredPermissions.length > 0) {
    const missingPermissions = requiredPermissions.filter(permission => !hasPermission(permission));
    if (missingPermissions.length > 0) {
      const reason = `Missing required permissions: ${missingPermissions.join(', ')}.`;
      return unauthorizedComponent || <UnauthorizedAccess reason={reason} />;
    }
  }

  // Check tenant requirement
  if (requireTenant && !user.tenantId) {
    const reason = "This page requires tenant access. No tenant associated with your account.";
    return unauthorizedComponent || <UnauthorizedAccess reason={reason} />;
  }

  // Custom access check
  if (customAccessCheck && !customAccessCheck(user)) {
    const reason = "Custom access requirements not met.";
    return unauthorizedComponent || <UnauthorizedAccess reason={reason} />;
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * Higher-order component for route protection
 */
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  protectionConfig: Omit<ProtectedRouteProps, 'children'>
) => {
  const ProtectedComponent = (props: P) => (
    <ProtectedRoute {...protectionConfig}>
      <Component {...props} />
    </ProtectedRoute>
  );

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  return ProtectedComponent;
};

/**
 * Hook for checking access within components
 */
export const useRouteAccess = (config: Omit<ProtectedRouteProps, 'children'>) => {
  const { user, loading, isAuthenticated, hasRole, hasPermission } = useAuth();

  if (loading || !isAuthenticated || !user) {
    return {
      hasAccess: false,
      loading: loading,
      reason: loading ? 'Loading...' : 'Not authenticated',
    };
  }

  // Check denied roles
  if (config.deniedRoles?.some(role => hasRole(role))) {
    return {
      hasAccess: false,
      loading: false,
      reason: `Access denied for ${user.role} role`,
    };
  }

  // Check required role
  if (config.requiredRole && !hasRole(config.requiredRole)) {
    return {
      hasAccess: false,
      loading: false,
      reason: `Requires ${config.requiredRole} role`,
    };
  }

  // Check required roles
  if (config.requiredRoles?.length && !config.requiredRoles.some(role => hasRole(role))) {
    return {
      hasAccess: false,
      loading: false,
      reason: `Requires one of: ${config.requiredRoles.join(', ')}`,
    };
  }

  // Check allowed roles
  if (config.allowedRoles?.length && !config.allowedRoles.some(role => hasRole(role))) {
    return {
      hasAccess: false,
      loading: false,
      reason: `Access restricted to: ${config.allowedRoles.join(', ')}`,
    };
  }

  // Check permissions
  if (config.requiredPermissions?.length) {
    const missingPermissions = config.requiredPermissions.filter(permission => !hasPermission(permission));
    if (missingPermissions.length > 0) {
      return {
        hasAccess: false,
        loading: false,
        reason: `Missing permissions: ${missingPermissions.join(', ')}`,
      };
    }
  }

  // Check tenant requirement
  if (config.requireTenant && !user.tenantId) {
    return {
      hasAccess: false,
      loading: false,
      reason: 'Requires tenant access',
    };
  }

  // Custom access check
  if (config.customAccessCheck && !config.customAccessCheck(user)) {
    return {
      hasAccess: false,
      loading: false,
      reason: 'Custom access requirements not met',
    };
  }

  return {
    hasAccess: true,
    loading: false,
    reason: null,
  };
};

export default ProtectedRoute;