/**
 * Routing configuration for multi-tenant architecture
 */

/**
 * Platform Management Routes (SmartSeller Admin)
 */
export const PLATFORM_ROUTES = {
  DASHBOARD: '/platform',
  TENANTS: '/platform/tenants',
  TENANT_DETAIL: '/platform/tenants/:id',
  USERS: '/platform/users',
  BILLING: '/platform/billing',
  ANALYTICS: '/platform/analytics',
  SETTINGS: '/platform/settings',
  SUPPORT: '/platform/support',
} as const;

/**
 * Tenant Admin Routes (Business Owner Dashboard)
 */
export const TENANT_ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  PRODUCTS: '/admin/products',
  PRODUCT_CREATE: '/admin/products/new',
  PRODUCT_EDIT: '/admin/products/:id/edit',
  ORDERS: '/admin/orders',
  ORDER_DETAIL: '/admin/orders/:id',
  CUSTOMERS: '/admin/customers',
  CUSTOMER_DETAIL: '/admin/customers/:id',
  ANALYTICS: '/admin/analytics',
  MARKETING: '/admin/marketing',
  INVENTORY: '/admin/inventory',
  SETTINGS: '/admin/settings',
  STAFF: '/admin/staff',
} as const;

/**
 * Customer Storefront Routes
 */
export const STOREFRONT_ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:slug',
  CATEGORY: '/categories/:slug',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ACCOUNT: '/account',
  ORDERS: '/account/orders',
  ORDER_DETAIL: '/account/orders/:id',
  WISHLIST: '/account/wishlist',
  PROFILE: '/account/profile',
  ADDRESSES: '/account/addresses',
  SEARCH: '/search',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
} as const;

/**
 * Authentication Routes
 */
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  LOGOUT: '/auth/logout',
} as const;

/**
 * Route configuration for different deployment strategies
 */
export const ROUTING_CONFIG = {
  // Subdomain strategy: tenant.smartseller.com
  SUBDOMAIN: {
    pattern: '{tenant}.smartseller.com',
    adminPath: '/admin',
    storefrontPath: '/',
  },
  
  // Path-based strategy: smartseller.com/tenant
  PATH_BASED: {
    pattern: 'smartseller.com/{tenant}',
    adminPath: '/{tenant}/admin',
    storefrontPath: '/{tenant}',
  },
  
  // Custom domain strategy: customdomain.com
  CUSTOM_DOMAIN: {
    pattern: '{domain}',
    adminPath: '/admin',
    storefrontPath: '/',
  },
} as const;

export type RoutingStrategy = keyof typeof ROUTING_CONFIG;