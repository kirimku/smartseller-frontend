/**
 * User-related type definitions
 */

/**
 * Base user interface
 */
export interface BaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

/**
 * Platform admin user (SmartSeller admin)
 */
export interface PlatformUser extends BaseUser {
  role: 'super_admin' | 'admin' | 'support' | 'developer';
  permissions: PlatformPermission[];
  accessLevel: 'full' | 'limited' | 'read_only';
}

/**
 * Platform permissions
 */
export type PlatformPermission =
  | 'manage_tenants'
  | 'manage_users'
  | 'manage_billing'
  | 'manage_plans'
  | 'view_analytics'
  | 'manage_support'
  | 'manage_system'
  | 'manage_integrations';

/**
 * Tenant admin user (Business owner/manager)
 */
export interface TenantAdminUser extends BaseUser {
  tenantId: string;
  role: 'owner' | 'manager' | 'staff' | 'accountant' | 'marketing';
  permissions: TenantPermission[];
  departments?: string[];
  jobTitle?: string;
  notes?: string;
}

/**
 * Tenant permissions
 */
export type TenantPermission =
  | 'manage_products'
  | 'manage_orders'
  | 'manage_customers'
  | 'manage_inventory'
  | 'manage_analytics'
  | 'manage_settings'
  | 'manage_staff'
  | 'manage_marketing'
  | 'manage_reports'
  | 'manage_billing'
  | 'manage_integrations'
  | 'view_dashboard';

/**
 * Customer user
 */
export interface CustomerUser extends BaseUser {
  tenantId: string;
  customerGroup?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  
  // Preferences
  preferences: {
    marketing: boolean;
    sms: boolean;
    push: boolean;
    language: string;
    currency: string;
  };
  
  // Loyalty
  loyaltyPoints?: number;
  loyaltyTier?: string;
  referralCode?: string;
  referredBy?: string;
  
  // Address book
  addresses: CustomerAddress[];
  defaultShippingAddress?: string;
  defaultBillingAddress?: string;
  
  // Statistics
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt?: string;
}

/**
 * Customer address
 */
export interface CustomerAddress {
  id: string;
  type: 'shipping' | 'billing' | 'both';
  label?: string; // "Home", "Work", etc.
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User session information
 */
export interface UserSession {
  id: string;
  userId: string;
  tenantId?: string;
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  createdAt: string;
  lastActivity: string;
  isActive: boolean;
}

/**
 * User activity log
 */
export interface UserActivity {
  id: string;
  userId: string;
  tenantId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * User authentication data
 */
export interface UserAuth {
  user: PlatformUser | TenantAdminUser | CustomerUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
  session: UserSession;
}

/**
 * User profile update data
 */
export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  preferences?: Partial<CustomerUser['preferences']>;
}