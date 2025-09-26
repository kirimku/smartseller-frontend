/**
 * Tenant-related type definitions
 */

/**
 * Feature flags for tenant plans
 */
export interface FeatureFlags {
  // Core E-commerce Features
  multiCurrency: boolean;
  multiLanguage: boolean;
  inventory: boolean;
  analytics: boolean;
  reporting: boolean;
  
  // Customer Features
  wishlist: boolean;
  reviews: boolean;
  ratings: boolean;
  compareProducts: boolean;
  recentlyViewed: boolean;
  
  // Loyalty & Marketing
  loyaltyProgram: boolean;
  pointsSystem: boolean;
  referralProgram: boolean;
  coupons: boolean;
  flashDeals: boolean;
  bundleDeals: boolean;
  
  // Marketing Tools
  emailMarketing: boolean;
  smsMarketing: boolean;
  pushNotifications: boolean;
  socialMediaIntegration: boolean;
  blogModule: boolean;
  
  // Advanced Features
  subscriptions: boolean;
  preOrders: boolean;
  backorders: boolean;
  productVariants: boolean;
  productBundles: boolean;
  giftCards: boolean;
  
  // SEO & Performance
  seoTools: boolean;
  sitemap: boolean;
  structuredData: boolean;
  pageSpeed: boolean;
  imageOptimization: boolean;
  
  // Integration Features
  api: boolean;
  webhooks: boolean;
  thirdPartyIntegrations: boolean;
  paymentGateways: string[];
  shippingProviders: string[];
  marketplaceIntegrations: string[];
  
  // Customization
  customDomain: boolean;
  whiteLabel: boolean;
  customCheckout: boolean;
  customEmails: boolean;
  
  // Support & Communication
  liveChat: boolean;
  helpDesk: boolean;
  knowledgeBase: boolean;
  communityForum: boolean;
  
  // Security & Compliance
  twoFactorAuth: boolean;
  sslCertificate: boolean;
  gdprCompliance: boolean;
  dataBackup: boolean;
  auditLogs: boolean;
}

/**
 * Tenant theme configuration
 */
export interface TenantTheme {
  // Brand Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  errorColor: string;
  warningColor: string;
  successColor: string;
  infoColor: string;
  
  // Text Colors
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textOnPrimary: string;
  textOnSecondary: string;
  
  // Typography
  fontFamily: string;
  headingFontFamily?: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  
  // Layout
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  
  // Shadows
  boxShadow: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Custom CSS variables
  customCss?: string;
}

/**
 * Tenant business information
 */
export interface TenantBusinessInfo {
  businessName: string;
  businessType: 'retail' | 'wholesale' | 'service' | 'digital' | 'other';
  description?: string;
  
  // Contact Information
  email: string;
  phone?: string;
  website?: string;
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  // Business Details
  taxId?: string;
  businessRegistrationNumber?: string;
  vatNumber?: string;
  
  // Social Media
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

/**
 * Tenant settings and preferences
 */
export interface TenantSettings {
  // Store Settings
  storeName: string;
  storeDescription?: string;
  storeUrl: string;
  
  // Operational Settings
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  
  // Business Hours
  businessHours?: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };
  
  // Order Settings
  orderSettings: {
    orderNumberPrefix: string;
    orderNumberLength: number;
    minimumOrderAmount?: number;
    maxOrderAmount?: number;
    allowGuestCheckout: boolean;
    requirePhoneNumber: boolean;
    autoConfirmOrders: boolean;
  };
  
  // Shipping Settings
  shippingSettings: {
    freeShippingThreshold?: number;
    defaultShippingMethod: string;
    estimatedDeliveryDays: number;
    allowPickup: boolean;
    pickupAddress?: string;
  };
  
  // Tax Settings
  taxSettings: {
    includeTaxInPrices: boolean;
    taxRate: number;
    taxCalculationMethod: 'inclusive' | 'exclusive';
    showTaxBreakdown: boolean;
  };
  
  // Notification Settings
  notifications: {
    orderNotifications: boolean;
    lowStockAlerts: boolean;
    customerMessageAlerts: boolean;
    marketingEmails: boolean;
  };
  
  // SEO Settings
  seoSettings?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    ogImage?: string;
    twitterCard?: string;
  };
}

/**
 * Main tenant configuration
 */
export interface TenantConfig {
  id: string;
  slug: string; // URL-friendly identifier
  status: 'active' | 'inactive' | 'suspended' | 'trial' | 'expired';
  
  // Plan and billing
  plan: 'basic' | 'premium' | 'enterprise';
  planStartDate: string;
  planEndDate?: string;
  billingCycle: 'monthly' | 'yearly';
  
  // Business information
  businessInfo: TenantBusinessInfo;
  
  // Configuration
  settings: TenantSettings;
  theme: TenantTheme;
  features: FeatureFlags;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Optional custom fields
  customFields?: Record<string, unknown>;
}