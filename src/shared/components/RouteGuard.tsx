import React, { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermissions?: string[];
  requireTenant?: boolean;
  fallbackPath?: string;
  loadingComponent?: ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  requireTenant = false,
  fallbackPath,
  loadingComponent
}) => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const location = useLocation();

  // Show loading while auth is being determined
  if (authLoading || (requireTenant && tenantLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loadingComponent || (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginPath = getLoginPathForRole(requiredRole);
    return (
      <Navigate 
        to={`${loginPath}?redirect=${encodeURIComponent(location.pathname)}`} 
        replace 
      />
    );
  }

  // Check role requirements
  if (requiredRole && user?.role !== requiredRole) {
    const unauthorizedPath = getUnauthorizedPath(user?.role);
    return <Navigate to={unauthorizedPath} replace />;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(
      permission => user?.permissions?.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this resource.</p>
          </div>
        </div>
      );
    }
  }

  // Check tenant requirements
  if (requireTenant && !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-600">The requested store could not be found.</p>
        </div>
      </div>
    );
  }

  // Validate tenant access for tenant_admin and customer roles
  if (requireTenant && user && ['tenant_admin', 'customer'].includes(user.role!)) {
    if (user.tenantId !== tenant?.id) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have access to this store.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Helper function to get appropriate login path based on role
function getLoginPathForRole(role?: UserRole): string {
  switch (role) {
    case 'platform_admin':
      return '/platform/login';
    case 'tenant_admin':
      return '/admin/login';
    case 'customer':
      return '/login';
    default:
      return '/login';
  }
}

// Helper function to get appropriate path for unauthorized users
function getUnauthorizedPath(userRole?: UserRole): string {
  switch (userRole) {
    case 'platform_admin':
      return '/platform/dashboard';
    case 'tenant_admin':
      return '/admin/dashboard';
    case 'customer':
      return '/';
    default:
      return '/';
  }
}

// Higher-order component for route protection
export const withRouteGuard = (
  Component: React.ComponentType<any>,
  guardProps: Omit<RouteGuardProps, 'children'>
) => {
  return (props: any) => (
    <RouteGuard {...guardProps}>
      <Component {...props} />
    </RouteGuard>
  );
};

// Specific guard components for different roles
export const PlatformGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RouteGuard requiredRole="platform_admin">
    {children}
  </RouteGuard>
);

export const TenantAdminGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RouteGuard requiredRole="tenant_admin" requireTenant>
    {children}
  </RouteGuard>
);

export const CustomerGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RouteGuard requiredRole="customer" requireTenant>
    {children}
  </RouteGuard>
);

// Permission-based guard
export const PermissionGuard: React.FC<{
  children: ReactNode;
  permissions: string[];
  fallback?: ReactNode;
}> = ({ children, permissions, fallback }) => {
  const { user } = useAuth();
  
  const hasAllPermissions = permissions.every(
    permission => user?.permissions?.includes(permission)
  );

  if (!hasAllPermissions) {
    return fallback || (
      <div className="text-center py-8">
        <p className="text-gray-600">You don't have permission to view this content.</p>
      </div>
    );
  }

  return <>{children}</>;
};