import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  storeName: string;
  description?: string;
  domain?: string;
  subdomain: string;
  status: 'active' | 'suspended' | 'pending_setup';
  planType: 'basic' | 'premium' | 'enterprise';
  contactEmail: string;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantTheme {
  id: string;
  tenantId: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  fontFamily: string;
  logoUrl: string;
  faviconUrl: string;
  layoutStyle: 'modern' | 'classic' | 'minimal';
  customCss?: string;
}

export interface FeatureFlags {
  multiCurrency: boolean;
  inventory: boolean;
  analytics: boolean;
  wishlist: boolean;
  reviews: boolean;
  loyaltyProgram: boolean;
  emailMarketing: boolean;
  api: boolean;
  customDomain: boolean;
  flashDeals: boolean;
  search: boolean;
  subscriptions: boolean;
  socialLogin: boolean;
  guestCheckout: boolean;
}

export interface TenantSettings {
  currency: string;
  timezone: string;
  language: string;
  taxRate: number;
  shippingRates: ShippingRate[];
  emailTemplates: Record<string, string>;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface ShippingRate {
  id: string;
  name: string;
  rate: number;
  estimatedDays: string;
}

interface TenantContextType {
  tenant: TenantConfig | null;
  theme: TenantTheme | null;
  features: FeatureFlags | null;
  loading: boolean;
  error: Error | null;
  loadTenant: (slugOrId: string) => Promise<void>;
  hasFeature: (feature: keyof FeatureFlags) => boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Plan-based feature flags
const PLAN_FEATURES: Record<string, FeatureFlags> = {
  basic: {
    multiCurrency: false,
    inventory: true,
    analytics: false,
    wishlist: false,
    reviews: true,
    loyaltyProgram: false,
    emailMarketing: false,
    api: false,
    customDomain: false,
    flashDeals: false,
    search: true,
    subscriptions: false,
    socialLogin: false,
    guestCheckout: true,
  },
  premium: {
    multiCurrency: true,
    inventory: true,
    analytics: true,
    wishlist: true,
    reviews: true,
    loyaltyProgram: true,
    emailMarketing: true,
    api: false,
    customDomain: false,
    flashDeals: true,
    search: true,
    subscriptions: true,
    socialLogin: true,
    guestCheckout: true,
  },
  enterprise: {
    multiCurrency: true,
    inventory: true,
    analytics: true,
    wishlist: true,
    reviews: true,
    loyaltyProgram: true,
    emailMarketing: true,
    api: true,
    customDomain: true,
    flashDeals: true,
    search: true,
    subscriptions: true,
    socialLogin: true,
    guestCheckout: true,
  },
};

// Mock tenant data
const MOCK_TENANTS: Record<string, TenantConfig> = {
  'gaming-pro-store': {
    id: 'gaming-pro-store',
    slug: 'gaming-pro',
    name: 'Gaming Pro Store',
    storeName: 'Gaming Pro',
    description: 'Your ultimate gaming gear destination',
    domain: 'gamingpro.com',
    subdomain: 'gaming-pro',
    status: 'active',
    planType: 'premium',
    contactEmail: 'admin@gamingpro.com',
    settings: {
      currency: 'USD',
      timezone: 'America/New_York',
      language: 'en',
      taxRate: 8.5,
      shippingRates: [
        { id: 'standard', name: 'Standard Shipping', rate: 9.99, estimatedDays: '3-5 business days' },
        { id: 'express', name: 'Express Shipping', rate: 19.99, estimatedDays: '1-2 business days' },
      ],
      emailTemplates: {},
      socialLinks: {
        facebook: 'https://facebook.com/gamingpro',
        twitter: 'https://twitter.com/gamingpro',
        instagram: 'https://instagram.com/gamingpro',
      },
    },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-03-20T00:00:00Z',
  },
  'tech-hub': {
    id: 'tech-hub',
    slug: 'tech-hub',
    name: 'Tech Gadgets Hub',
    storeName: 'Tech Hub',
    description: 'Latest technology gadgets and accessories',
    subdomain: 'tech-hub',
    status: 'active',
    planType: 'enterprise',
    contactEmail: 'admin@techhub.com',
    settings: {
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      language: 'en',
      taxRate: 10.25,
      shippingRates: [
        { id: 'free', name: 'Free Shipping', rate: 0, estimatedDays: '5-7 business days' },
        { id: 'standard', name: 'Standard Shipping', rate: 8.99, estimatedDays: '3-5 business days' },
      ],
      emailTemplates: {},
      socialLinks: {},
    },
    createdAt: '2024-02-03T00:00:00Z',
    updatedAt: '2024-03-22T00:00:00Z',
  },
};

// Mock themes
const MOCK_THEMES: Record<string, TenantTheme> = {
  'gaming-pro-store': {
    id: 'theme-gaming-pro',
    tenantId: 'gaming-pro-store',
    colors: {
      primary: '#ff6b35',
      secondary: '#004e89',
      accent: '#1a759f',
      background: '#ffffff',
      text: '#1e293b',
      border: '#e2e8f0',
    },
    fontFamily: 'Inter, sans-serif',
    logoUrl: '/assets/tenants/gaming-pro/logo.png',
    faviconUrl: '/assets/tenants/gaming-pro/favicon.ico',
    layoutStyle: 'modern',
  },
  'tech-hub': {
    id: 'theme-tech-hub',
    tenantId: 'tech-hub',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#06b6d4',
      background: '#ffffff',
      text: '#0f172a',
      border: '#e2e8f0',
    },
    fontFamily: 'Roboto, sans-serif',
    logoUrl: '/assets/tenants/tech-hub/logo.png',
    faviconUrl: '/assets/tenants/tech-hub/favicon.ico',
    layoutStyle: 'minimal',
  },
};

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [theme, setTheme] = useState<TenantTheme | null>(null);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to resolve tenant from URL
  const resolveTenantFromUrl = (): string | null => {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // Check for subdomain (e.g., gaming-pro.smartseller.com)
    if (hostname.includes('.') && hostname !== 'localhost') {
      const subdomain = hostname.split('.')[0];
      if (subdomain && subdomain !== 'www') {
        return subdomain;
      }
    }
    
    // Check for path-based routing (e.g., /store/gaming-pro)
    const pathMatch = pathname.match(/^\/store\/([^\/]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }
    
    // Default tenant for development
    return 'gaming-pro-store';
  };

  const loadTenant = async (slugOrId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find tenant by slug or id
      const tenantData = MOCK_TENANTS[slugOrId] || 
                        Object.values(MOCK_TENANTS).find(t => t.slug === slugOrId);

      if (!tenantData) {
        throw new Error(`Tenant not found: ${slugOrId}`);
      }

      // Load theme
      const themeData = MOCK_THEMES[tenantData.id];
      
      // Get features based on plan
      const tenantFeatures = PLAN_FEATURES[tenantData.planType] || PLAN_FEATURES.basic;

      setTenant(tenantData);
      setTheme(themeData || null);
      setFeatures(tenantFeatures);

      // Apply theme to document
      if (themeData) {
        applyTheme(themeData);
      }

    } catch (err) {
      setError(err as Error);
      setTenant(null);
      setTheme(null);
      setFeatures(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshTenant = async () => {
    if (tenant) {
      await loadTenant(tenant.id);
    }
  };

  const hasFeature = (feature: keyof FeatureFlags): boolean => {
    return features?.[feature] === true;
  };

  // Apply theme to document
  const applyTheme = (themeData: TenantTheme) => {
    const root = document.documentElement;
    
    Object.entries(themeData.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    root.style.setProperty('--font-family-primary', themeData.fontFamily);

    // Update favicon
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = themeData.faviconUrl;
    }

    // Update document title
    if (tenant) {
      document.title = `${tenant.storeName} - SmartSeller`;
    }
  };

  // Auto-load tenant on mount
  useEffect(() => {
    const tenantSlug = resolveTenantFromUrl();
    if (tenantSlug) {
      loadTenant(tenantSlug);
    } else {
      setLoading(false);
    }
  }, []);

  const value: TenantContextType = {
    tenant,
    theme,
    features,
    loading,
    error,
    loadTenant,
    hasFeature,
    refreshTenant,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};