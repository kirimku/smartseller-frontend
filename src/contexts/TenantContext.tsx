import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { TenantConfig, TenantTheme, FeatureFlags } from '../shared/types/tenant';

/**
 * Tenant Context Type Definition
 */
interface TenantContextType {
  tenant: TenantConfig | null;
  theme: TenantTheme | null;
  features: FeatureFlags | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateTenant: (tenant: TenantConfig) => void;
  updateTheme: (theme: Partial<TenantTheme>) => void;
  clearTenant: () => void;
  hasFeature: (feature: keyof FeatureFlags) => boolean;
}

/**
 * Create Tenant Context
 */
const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * Tenant Provider Props
 */
interface TenantProviderProps {
  children: ReactNode;
  tenantSlug?: string;
  mockData?: boolean;
}

/**
 * Mock tenant data for development
 */
const createMockTenant = (slug: string = 'demo-store'): TenantConfig => ({
  id: '1',
  slug,
  status: 'active',
  plan: 'premium',
  planStartDate: '2024-01-01',
  planEndDate: '2024-12-31',
  billingCycle: 'monthly',
  
  businessInfo: {
    businessName: 'Demo Gaming Store',
    businessType: 'retail',
    description: 'Premium gaming equipment and accessories',
    email: 'contact@demogaming.com',
    phone: '+1234567890',
    website: 'https://demogaming.com',
    address: {
      street: '123 Gaming Street',
      city: 'Tech City',
      state: 'California',
      postalCode: '90210',
      country: 'United States'
    },
    socialMedia: {
      facebook: 'demogaming',
      twitter: '@demogaming',
      instagram: 'demogaming'
    }
  },
  
  settings: {
    storeName: 'Demo Gaming Store',
    storeDescription: 'Your one-stop shop for premium gaming gear',
    storeUrl: `https://${slug}.smartseller.com`,
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    
    orderSettings: {
      orderNumberPrefix: 'DGS',
      orderNumberLength: 6,
      minimumOrderAmount: 25,
      allowGuestCheckout: true,
      requirePhoneNumber: false,
      autoConfirmOrders: true
    },
    
    shippingSettings: {
      freeShippingThreshold: 75,
      defaultShippingMethod: 'standard',
      estimatedDeliveryDays: 3,
      allowPickup: true,
      pickupAddress: '123 Gaming Street, Tech City, CA 90210'
    },
    
    taxSettings: {
      includeTaxInPrices: false,
      taxRate: 8.5,
      taxCalculationMethod: 'exclusive',
      showTaxBreakdown: true
    },
    
    notifications: {
      orderNotifications: true,
      lowStockAlerts: true,
      customerMessageAlerts: true,
      marketingEmails: false
    },
    
    seoSettings: {
      metaTitle: 'Demo Gaming Store - Premium Gaming Equipment',
      metaDescription: 'Shop the latest gaming gear, from high-performance keyboards to professional gaming mice.',
      metaKeywords: 'gaming, keyboards, mice, headsets, gaming gear',
      ogImage: '/images/og-image.jpg'
    }
  },
  
  theme: {
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    surfaceColor: '#F8FAFC',
    errorColor: '#EF4444',
    warningColor: '#F59E0B',
    successColor: '#10B981',
    infoColor: '#3B82F6',
    
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textDisabled: '#9CA3AF',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    spacing: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem'
    },
    
    boxShadow: {
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    }
  },
  
  features: {
    // Core E-commerce Features
    multiCurrency: true,
    multiLanguage: true,
    inventory: true,
    analytics: true,
    reporting: true,
    
    // Customer Features
    wishlist: true,
    reviews: true,
    ratings: true,
    compareProducts: true,
    recentlyViewed: true,
    
    // Loyalty & Marketing
    loyaltyProgram: true,
    pointsSystem: true,
    referralProgram: true,
    coupons: true,
    flashDeals: true,
    bundleDeals: true,
    
    // Marketing Tools
    emailMarketing: true,
    smsMarketing: true,
    pushNotifications: true,
    socialMediaIntegration: true,
    blogModule: true,
    
    // Advanced Features
    subscriptions: true,
    preOrders: true,
    backorders: true,
    productVariants: true,
    productBundles: true,
    giftCards: true,
    
    // SEO & Performance
    seoTools: true,
    sitemap: true,
    structuredData: true,
    pageSpeed: true,
    imageOptimization: true,
    
    // Integration Features
    api: false,
    webhooks: true,
    thirdPartyIntegrations: true,
    paymentGateways: ['stripe', 'paypal', 'square'],
    shippingProviders: ['fedex', 'ups', 'dhl', 'standard'],
    marketplaceIntegrations: ['shopify', 'woocommerce'],
    
    // Customization
    customDomain: false,
    whiteLabel: false,
    customCheckout: true,
    customEmails: true,
    
    // Support & Communication
    liveChat: true,
    helpDesk: true,
    knowledgeBase: true,
    communityForum: false,
    
    // Security & Compliance
    twoFactorAuth: true,
    sslCertificate: true,
    gdprCompliance: true,
    dataBackup: true,
    auditLogs: false
  },
  
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
});

/**
 * Tenant Provider Component
 */
export const TenantProvider: React.FC<TenantProviderProps> = ({
  children,
  tenantSlug = 'demo-store',
  mockData = true
}) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [theme, setTheme] = useState<TenantTheme | null>(null);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tenant data
  useEffect(() => {
    const loadTenant = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (mockData) {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const mockTenant = createMockTenant(tenantSlug);
          setTenant(mockTenant);
          setTheme(mockTenant.theme);
          setFeatures(mockTenant.features);
        } else {
          // TODO: Replace with actual API call
          // const response = await api.get(`/tenants/by-slug/${tenantSlug}`);
          // setTenant(response.data);
          throw new Error('Real API not implemented yet');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load tenant';
        setError(errorMessage);
        console.error('Failed to load tenant:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (tenantSlug) {
      loadTenant();
    }
  }, [tenantSlug, mockData]);

  // Apply theme to CSS variables
  useEffect(() => {
    if (theme && typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Apply theme colors as CSS custom properties
      root.style.setProperty('--color-primary', theme.primaryColor);
      root.style.setProperty('--color-secondary', theme.secondaryColor);
      root.style.setProperty('--color-accent', theme.accentColor);
      root.style.setProperty('--color-background', theme.backgroundColor);
      root.style.setProperty('--color-surface', theme.surfaceColor);
      root.style.setProperty('--color-error', theme.errorColor);
      root.style.setProperty('--color-warning', theme.warningColor);
      root.style.setProperty('--color-success', theme.successColor);
      root.style.setProperty('--color-info', theme.infoColor);
      
      root.style.setProperty('--text-primary', theme.textPrimary);
      root.style.setProperty('--text-secondary', theme.textSecondary);
      root.style.setProperty('--text-disabled', theme.textDisabled);
      
      root.style.setProperty('--font-family', theme.fontFamily);
      root.style.setProperty('--font-family-heading', theme.headingFontFamily || theme.fontFamily);
      
      // Apply border radius
      root.style.setProperty('--radius-sm', theme.borderRadius.sm);
      root.style.setProperty('--radius-md', theme.borderRadius.md);
      root.style.setProperty('--radius-lg', theme.borderRadius.lg);
    }
  }, [theme]);

  // Actions
  const updateTenant = (newTenant: TenantConfig) => {
    setTenant(newTenant);
    setTheme(newTenant.theme);
    setFeatures(newTenant.features);
  };

  const updateTheme = (themeUpdates: Partial<TenantTheme>) => {
    if (theme) {
      const updatedTheme = { ...theme, ...themeUpdates };
      setTheme(updatedTheme);
      
      if (tenant) {
        setTenant({
          ...tenant,
          theme: updatedTheme
        });
      }
    }
  };

  const clearTenant = () => {
    setTenant(null);
    setTheme(null);
    setFeatures(null);
    setError(null);
  };

  const hasFeature = (feature: keyof FeatureFlags): boolean => {
    return features?.[feature] === true;
  };

  const contextValue: TenantContextType = {
    tenant,
    theme,
    features,
    isLoading,
    error,
    updateTenant,
    updateTheme,
    clearTenant,
    hasFeature
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

export default TenantProvider;