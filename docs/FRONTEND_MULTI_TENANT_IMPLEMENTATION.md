# SmartSeller Frontend Multi-Tenant Architecture Implementation Guide

## Overview

This document provides a detailed implementation guide for transforming the current single-tenant SmartSeller frontend into a multi-tenant architecture that can serve multiple storefronts while maintaining clean separation between platform management, tenant administration, and customer-facing interfaces.

## Table of Contents
1. [Current Frontend Architecture Analysis](#current-frontend-architecture-analysis)
2. [Multi-Tenant Frontend Strategy](#multi-tenant-frontend-strategy)
3. [Project Structure Refactoring](#project-structure-refactoring)
4. [Tenant Context System](#tenant-context-system)
5. [Dynamic Theming & Branding](#dynamic-theming--branding)
6. [Multi-Tenant Routing](#multi-tenant-routing)
7. [State Management Evolution](#state-management-evolution)
8. [Component Architecture Patterns](#component-architecture-patterns)
9. [Build & Deployment Strategy](#build--deployment-strategy)
10. [Performance Optimization](#performance-optimization)
11. [Implementation Roadmap](#implementation-roadmap)

## Current Frontend Architecture Analysis

### Existing Structure Assessment

```typescript
// Current structure strengths and limitations
interface CurrentArchitectureAnalysis {
  strengths: [
    "Well-organized component structure with shadcn/ui",
    "Clean separation between admin and customer interfaces", 
    "Mobile-first responsive design",
    "Modern React patterns with hooks and context",
    "Good performance with Vite build system"
  ];
  
  limitations: [
    "Hardcoded tenant-specific branding (Rexus)",
    "Single-tenant routing structure",
    "Static configuration without runtime customization",
    "No tenant isolation in components",
    "Monolithic build output"
  ];
  
  technicalDebt: [
    "Hardcoded theme colors in Tailwind config",
    "Rexus-specific assets and branding",
    "Fixed product categories and features",
    "No dynamic domain handling",
    "Static environment configuration"
  ];
}
```

### Current Component Analysis

```typescript
// Analysis of existing components for multi-tenant readiness
interface ComponentReadinessAssessment {
  readyForMultiTenant: [
    "UI components (shadcn/ui based)",
    "Layout components with props",
    "Generic form components",
    "Utility hooks"
  ];
  
  needsRefactoring: [
    "Header component (hardcoded branding)",
    "Hero section (static banners)",
    "Theme-dependent components",
    "Navigation components"
  ];
  
  requiresRedesign: [
    "Asset management system",
    "Theme configuration",
    "Routing logic",
    "API integration layer"
  ];
}
```

## Multi-Tenant Frontend Strategy

### Architecture Principles

```typescript
interface MultiTenantPrinciples {
  dataIsolation: "Complete tenant data separation";
  uiCustomization: "Runtime theme and branding customization";
  performanceIsolation: "Tenant-specific caching and optimization";
  featureIsolation: "Conditional feature rendering based on tenant plan";
  codeReusability: "Maximum component reuse across tenants";
  scalability: "Support for thousands of concurrent tenants";
}
```

### Three-Tier Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Platform Management Layer                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ SmartSeller Platform Admin                              │ │
│  │ - Tenant Management                                     │ │
│  │ - Platform Analytics                                    │ │
│  │ - Billing & Subscriptions                              │ │
│  │ - System Configuration                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                Tenant Management Layer                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Tenant Admin Dashboard                                  │ │
│  │ - Store Configuration                                   │ │
│  │ - Product Management                                    │ │
│  │ - Order Processing                                      │ │
│  │ - Customer Management                                   │ │
│  │ - Analytics & Reports                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                Customer Storefront Layer                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Multi-Tenant Storefronts                               │ │
│  │ - Dynamic Branding                                      │ │
│  │ - Product Catalog                                       │ │
│  │ - Shopping Cart                                         │ │
│  │ - Customer Accounts                                     │ │
│  │ - Order Management                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure Refactoring

### New Directory Structure

```
src/
├── platform/                          # Platform management (SmartSeller admin)
│   ├── components/
│   │   ├── tenant-management/
│   │   │   ├── TenantList.tsx
│   │   │   ├── TenantForm.tsx
│   │   │   ├── TenantSettings.tsx
│   │   │   └── TenantOnboarding.tsx
│   │   ├── analytics/
│   │   │   ├── PlatformDashboard.tsx
│   │   │   ├── RevenueCharts.tsx
│   │   │   └── UsageMetrics.tsx
│   │   ├── billing/
│   │   │   ├── SubscriptionManager.tsx
│   │   │   ├── InvoiceList.tsx
│   │   │   └── PaymentMethods.tsx
│   │   └── system/
│   │       ├── SystemSettings.tsx
│   │       └── PlatformHealth.tsx
│   ├── pages/
│   │   ├── PlatformDashboard.tsx
│   │   ├── TenantManagement.tsx
│   │   ├── PlatformAnalytics.tsx
│   │   ├── BillingManagement.tsx
│   │   └── SystemConfiguration.tsx
│   ├── hooks/
│   │   ├── usePlatformMetrics.ts
│   │   ├── useTenantManagement.ts
│   │   └── useBillingData.ts
│   └── types/
│       ├── platform.ts
│       └── billing.ts
│
├── tenant/                            # Tenant-specific functionality
│   ├── admin/                         # Tenant admin dashboard
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── SalesOverview.tsx
│   │   │   │   ├── OrderSummary.tsx
│   │   │   │   └── CustomerInsights.tsx
│   │   │   ├── products/
│   │   │   │   ├── ProductList.tsx
│   │   │   │   ├── ProductForm.tsx
│   │   │   │   ├── CategoryManager.tsx
│   │   │   │   ├── InventoryTracker.tsx
│   │   │   │   └── ProductImporter.tsx
│   │   │   ├── orders/
│   │   │   │   ├── OrderQueue.tsx
│   │   │   │   ├── OrderDetails.tsx
│   │   │   │   ├── FulfillmentCenter.tsx
│   │   │   │   └── ShippingManager.tsx
│   │   │   ├── customers/
│   │   │   │   ├── CustomerList.tsx
│   │   │   │   ├── CustomerProfile.tsx
│   │   │   │   └── CustomerSegments.tsx
│   │   │   ├── marketing/
│   │   │   │   ├── CampaignManager.tsx
│   │   │   │   ├── DiscountCodes.tsx
│   │   │   │   ├── EmailTemplates.tsx
│   │   │   │   └── LoyaltyProgram.tsx
│   │   │   └── settings/
│   │   │       ├── StoreConfiguration.tsx
│   │   │       ├── ThemeCustomizer.tsx
│   │   │       ├── PaymentSettings.tsx
│   │   │       ├── ShippingSettings.tsx
│   │   │       └── TaxConfiguration.tsx
│   │   ├── pages/
│   │   │   ├── TenantDashboard.tsx
│   │   │   ├── ProductManagement.tsx
│   │   │   ├── OrderManagement.tsx
│   │   │   ├── CustomerManagement.tsx
│   │   │   ├── MarketingTools.tsx
│   │   │   ├── AnalyticsReports.tsx
│   │   │   └── StoreSettings.tsx
│   │   ├── hooks/
│   │   │   ├── useTenantDashboard.ts
│   │   │   ├── useProductManagement.ts
│   │   │   ├── useOrderProcessing.ts
│   │   │   └── useCustomerData.ts
│   │   └── layouts/
│   │       ├── TenantAdminLayout.tsx
│   │       └── TenantSidebar.tsx
│   │
│   └── storefront/                    # Customer-facing store
│       ├── components/
│       │   ├── layout/
│       │   │   ├── StorefrontHeader.tsx
│       │   │   ├── StorefrontFooter.tsx
│       │   │   ├── NavigationMenu.tsx
│       │   │   └── MobileNavigation.tsx
│       │   ├── product/
│       │   │   ├── ProductGrid.tsx
│       │   │   ├── ProductCard.tsx
│       │   │   ├── ProductDetail.tsx
│       │   │   ├── ProductImageGallery.tsx
│       │   │   ├── ProductVariantSelector.tsx
│       │   │   ├── ProductReviews.tsx
│       │   │   └── RelatedProducts.tsx
│       │   ├── cart/
│       │   │   ├── ShoppingCart.tsx
│       │   │   ├── CartItem.tsx
│       │   │   ├── CartSummary.tsx
│       │   │   └── QuickAddToCart.tsx
│       │   ├── checkout/
│       │   │   ├── CheckoutForm.tsx
│       │   │   ├── ShippingForm.tsx
│       │   │   ├── PaymentForm.tsx
│       │   │   ├── OrderSummary.tsx
│       │   │   └── CheckoutProgress.tsx
│       │   ├── account/
│       │   │   ├── CustomerProfile.tsx
│       │   │   ├── OrderHistory.tsx
│       │   │   ├── AddressBook.tsx
│       │   │   ├── WishList.tsx
│       │   │   └── LoyaltyDashboard.tsx
│       │   ├── search/
│       │   │   ├── SearchBar.tsx
│       │   │   ├── SearchResults.tsx
│       │   │   ├── SearchFilters.tsx
│       │   │   └── SearchSuggestions.tsx
│       │   └── marketing/
│       │       ├── HeroBanner.tsx
│       │       ├── FeaturedProducts.tsx
│       │       ├── PromotionalBanner.tsx
│       │       ├── NewsletterSignup.tsx
│       │       └── SocialProof.tsx
│       ├── pages/
│       │   ├── StorefrontHome.tsx
│       │   ├── ProductListing.tsx
│       │   ├── ProductDetail.tsx
│       │   ├── SearchResults.tsx
│       │   ├── ShoppingCart.tsx
│       │   ├── Checkout.tsx
│       │   ├── CustomerAccount.tsx
│       │   ├── OrderTracking.tsx
│       │   └── CustomerSupport.tsx
│       ├── hooks/
│       │   ├── useStorefrontData.ts
│       │   ├── useProductCatalog.ts
│       │   ├── useShoppingCart.ts
│       │   ├── useCheckout.ts
│       │   └── useCustomerAccount.ts
│       └── layouts/
│           ├── StorefrontLayout.tsx
│           └── CheckoutLayout.tsx
│
├── shared/                            # Shared components and utilities
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components (existing)
│   │   ├── forms/
│   │   │   ├── FormField.tsx
│   │   │   ├── FormValidation.tsx
│   │   │   └── FormWizard.tsx
│   │   ├── data-display/
│   │   │   ├── DataTable.tsx
│   │   │   ├── Charts.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── feedback/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── NotificationToast.tsx
│   │   └── layout/
│   │       ├── Container.tsx
│   │       ├── Grid.tsx
│   │       ├── Sidebar.tsx
│   │       └── Modal.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   ├── useTheme.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useInfiniteScroll.ts
│   │   └── useWebSocket.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── tenant.ts
│   │   │   └── types.ts
│   │   ├── utils/
│   │   │   ├── format.ts
│   │   │   ├── validation.ts
│   │   │   ├── encryption.ts
│   │   │   └── constants.ts
│   │   ├── theme/
│   │   │   ├── theme-engine.ts
│   │   │   ├── color-utils.ts
│   │   │   └── typography.ts
│   │   └── storage/
│   │       ├── cache.ts
│   │       ├── session.ts
│   │       └── persistence.ts
│   └── types/
│       ├── tenant.ts
│       ├── user.ts
│       ├── product.ts
│       ├── order.ts
│       ├── customer.ts
│       └── api.ts
│
├── contexts/                          # Global contexts
│   ├── TenantContext.tsx
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   ├── CartContext.tsx
│   └── NotificationContext.tsx
│
├── config/                           # Configuration files
│   ├── tenant-themes.ts
│   ├── feature-flags.ts
│   ├── api-endpoints.ts
│   ├── routing.ts
│   └── environment.ts
│
├── assets/                           # Static assets
│   ├── tenant-assets/                # Tenant-specific assets
│   │   ├── [tenant-id]/
│   │   │   ├── logo.png
│   │   │   ├── favicon.ico
│   │   │   ├── banners/
│   │   │   └── icons/
│   ├── platform/                     # Platform assets
│   │   ├── logo.png
│   │   ├── icons/
│   │   └── images/
│   └── shared/                       # Shared assets
│       ├── placeholders/
│       ├── icons/
│       └── images/
│
└── utils/                           # Utility functions
    ├── tenant-resolver.ts
    ├── route-generator.ts
    ├── asset-loader.ts
    └── performance.ts
```

### Migration Strategy for Existing Components

```typescript
// Component migration mapping
interface ComponentMigrationPlan {
  // Move to shared/components/ui (already compatible)
  uiComponents: [
    "src/components/ui/* → shared/components/ui/*"
  ];
  
  // Refactor and move to tenant/storefront/components
  storefrontComponents: {
    "src/components/common/Header.tsx": "tenant/storefront/components/layout/StorefrontHeader.tsx";
    "src/components/sections/hero-section.tsx": "tenant/storefront/components/marketing/HeroBanner.tsx";
    "src/components/sections/featured-products.tsx": "tenant/storefront/components/marketing/FeaturedProducts.tsx";
    "src/components/sections/rewards-section.tsx": "tenant/storefront/components/marketing/LoyaltyDashboard.tsx";
    "src/components/ui/mobile-nav.tsx": "tenant/storefront/components/layout/MobileNavigation.tsx";
  };
  
  // Refactor and move to tenant/admin/components
  adminComponents: {
    "src/pages/AdminLayout.tsx": "tenant/admin/layouts/TenantAdminLayout.tsx";
    "src/pages/AdminDashboard.tsx": "tenant/admin/pages/TenantDashboard.tsx";
    "src/pages/AdminProducts.tsx": "tenant/admin/pages/ProductManagement.tsx";
    "src/pages/AdminOrders.tsx": "tenant/admin/pages/OrderManagement.tsx";
  };
  
  // Create new platform components
  platformComponents: [
    "platform/components/tenant-management/*",
    "platform/components/analytics/*",
    "platform/components/billing/*"
  ];
}
```

## Tenant Context System

### Core Tenant Context Implementation

```typescript
// contexts/TenantContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TenantConfig, TenantTheme, FeatureFlags } from '../shared/types/tenant';
import { tenantApi } from '../shared/lib/api/tenant';

interface TenantContextType {
  // Tenant data
  tenant: TenantConfig | null;
  theme: TenantTheme | null;
  features: FeatureFlags | null;
  
  // Loading states
  loading: boolean;
  error: Error | null;
  
  // Actions
  loadTenant: (slugOrId: string) => Promise<void>;
  updateTenantConfig: (config: Partial<TenantConfig>) => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  
  // Utilities
  hasFeature: (feature: string) => boolean;
  getTenantAsset: (assetPath: string) => string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  initialTenant?: string;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ 
  children, 
  initialTenant 
}) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [theme, setTheme] = useState<TenantTheme | null>(null);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTenant = async (slugOrId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load tenant configuration
      const tenantData = await tenantApi.getTenant(slugOrId);
      setTenant(tenantData);
      
      // Load theme configuration
      const themeData = await tenantApi.getTenantTheme(tenantData.id);
      setTheme(themeData);
      
      // Load feature flags
      const featureData = await tenantApi.getTenantFeatures(tenantData.id);
      setFeatures(featureData);
      
      // Apply theme to DOM
      applyTenantTheme(themeData);
      
      // Update document title and favicon
      updateDocumentMeta(tenantData, themeData);
      
      // Store current tenant in localStorage for persistence
      localStorage.setItem('current-tenant', tenantData.id);
      
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTenantConfig = async (config: Partial<TenantConfig>) => {
    if (!tenant) return;
    
    try {
      const updatedTenant = await tenantApi.updateTenant(tenant.id, config);
      setTenant(updatedTenant);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const switchTenant = async (tenantId: string) => {
    await loadTenant(tenantId);
    
    // Update URL if needed (for admin switching between tenants)
    if (window.location.pathname.startsWith('/platform/')) {
      // Platform admin switching tenants - don't change URL
    } else {
      // Update storefront URL
      const newUrl = `/${tenant?.slug}${window.location.pathname}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  const hasFeature = (feature: string): boolean => {
    return features?.[feature] === true;
  };

  const getTenantAsset = (assetPath: string): string => {
    if (!tenant) return `/assets/shared/${assetPath}`;
    return `/assets/tenant-assets/${tenant.id}/${assetPath}`;
  };

  const applyTenantTheme = (themeData: TenantTheme) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    Object.entries(themeData.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Apply typography
    if (themeData.fontFamily) {
      root.style.setProperty('--font-family', themeData.fontFamily);
    }
    
    // Apply custom CSS if provided
    if (themeData.customCss) {
      let customStyleElement = document.getElementById('tenant-custom-styles');
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = 'tenant-custom-styles';
        document.head.appendChild(customStyleElement);
      }
      customStyleElement.textContent = themeData.customCss;
    }
  };

  const updateDocumentMeta = (tenantData: TenantConfig, themeData: TenantTheme) => {
    // Update title
    document.title = tenantData.storeName || 'SmartSeller Store';
    
    // Update favicon
    if (themeData.faviconUrl) {
      let favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = themeData.faviconUrl;
    }
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (metaDescription && tenantData.description) {
      metaDescription.content = tenantData.description;
    }
  };

  // Initialize tenant on mount
  useEffect(() => {
    const initializeTenant = async () => {
      // Try to get tenant from URL, localStorage, or props
      const tenantFromUrl = extractTenantFromUrl();
      const tenantFromStorage = localStorage.getItem('current-tenant');
      const tenantToLoad = initialTenant || tenantFromUrl || tenantFromStorage;
      
      if (tenantToLoad) {
        await loadTenant(tenantToLoad);
      } else {
        setLoading(false);
      }
    };

    initializeTenant();
  }, [initialTenant]);

  const extractTenantFromUrl = (): string | null => {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    
    // Check if we're on a tenant-specific route
    if (pathSegments.length > 0 && !['platform', 'admin'].includes(pathSegments[0])) {
      return pathSegments[0]; // Tenant slug from URL
    }
    
    return null;
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        theme,
        features,
        loading,
        error,
        loadTenant,
        updateTenantConfig,
        switchTenant,
        hasFeature,
        getTenantAsset,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

// Custom hook for using tenant context
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// HOC for tenant-aware components
export const withTenant = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    const { tenant, loading } = useTenant();
    
    if (loading) {
      return <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
    }
    
    if (!tenant) {
      return <div className="text-center py-8">
        <p className="text-muted-foreground">Tenant not found</p>
      </div>;
    }
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `withTenant(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
```

### Tenant Types and Interfaces

```typescript
// shared/types/tenant.ts
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
  
  // Contact information
  contactEmail: string;
  contactPhone?: string;
  supportEmail?: string;
  
  // Business information
  businessInfo?: {
    address: Address;
    taxId?: string;
    businessType?: string;
  };
  
  // Configuration
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantTheme {
  id: string;
  tenantId: string;
  
  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    destructive: string;
    warning: string;
    success: string;
  };
  
  // Typography
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  
  // Branding
  logoUrl: string;
  logoAltText: string;
  faviconUrl: string;
  
  // Layout
  layoutStyle: 'modern' | 'classic' | 'minimal';
  headerStyle: 'fixed' | 'static' | 'sticky';
  sidebarPosition: 'left' | 'right' | 'none';
  
  // Custom CSS
  customCss?: string;
  
  // Responsive breakpoints (optional override)
  breakpoints?: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlags {
  // Core features
  multiCurrency: boolean;
  multiLanguage: boolean;
  inventory: boolean;
  analytics: boolean;
  
  // E-commerce features
  wishlist: boolean;
  reviews: boolean;
  loyaltyProgram: boolean;
  affiliateProgram: boolean;
  subscriptions: boolean;
  
  // Marketing features
  emailMarketing: boolean;
  smsMarketing: boolean;
  socialMedia: boolean;
  seo: boolean;
  
  // Advanced features
  api: boolean;
  webhooks: boolean;
  customDomain: boolean;
  whiteLabel: boolean;
  
  // Integrations
  paymentGateways: string[];
  shippingProviders: string[];
  marketplaces: string[];
}

export interface TenantSettings {
  // Store settings
  currency: string;
  timezone: string;
  language: string;
  taxRate: number;
  
  // Shipping settings
  shippingRates: ShippingRate[];
  freeShippingThreshold: number;
  
  // Email settings
  emailTemplates: Record<string, string>;
  notificationSettings: {
    orderConfirmation: boolean;
    shippingUpdates: boolean;
    marketing: boolean;
  };
  
  // SEO settings
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  
  // Social media
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  
  // Custom fields
  customFields: Record<string, any>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShippingRate {
  id: string;
  name: string;
  description?: string;
  rate: number;
  freeOver?: number;
  estimatedDays: string;
}
```

## Dynamic Theming & Branding

### Theme Engine Implementation

```typescript
// shared/lib/theme/theme-engine.ts
interface ThemeEngine {
  loadTheme: (tenantId: string) => Promise<TenantTheme>;
  applyTheme: (theme: TenantTheme) => void;
  generateTailwindConfig: (theme: TenantTheme) => object;
  preloadTenantAssets: (tenantId: string) => Promise<void>;
}

class TenantThemeEngine implements ThemeEngine {
  private themeCache = new Map<string, TenantTheme>();
  private assetCache = new Map<string, string[]>();

  async loadTheme(tenantId: string): Promise<TenantTheme> {
    // Check cache first
    if (this.themeCache.has(tenantId)) {
      return this.themeCache.get(tenantId)!;
    }

    try {
      // Fetch theme from API
      const response = await fetch(`/api/tenants/${tenantId}/theme`);
      const theme: TenantTheme = await response.json();
      
      // Cache the theme
      this.themeCache.set(tenantId, theme);
      
      return theme;
    } catch (error) {
      console.error('Failed to load tenant theme:', error);
      return this.getDefaultTheme();
    }
  }

  applyTheme(theme: TenantTheme): void {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
      
      // Generate color variants (light, dark) for better UX
      const colorUtils = new ColorUtils();
      const lightVariant = colorUtils.lighten(value, 0.1);
      const darkVariant = colorUtils.darken(value, 0.1);
      
      root.style.setProperty(`--color-${key}-light`, lightVariant);
      root.style.setProperty(`--color-${key}-dark`, darkVariant);
    });

    // Apply typography variables
    root.style.setProperty('--font-family-primary', theme.fontFamily);
    Object.entries(theme.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    // Apply layout variables
    root.style.setProperty('--header-height', theme.headerStyle === 'fixed' ? '64px' : 'auto');
    
    // Apply custom CSS
    this.applyCustomCSS(theme.customCss);
    
    // Update favicon and meta tags
    this.updateDocumentMeta(theme);
  }

  private applyCustomCSS(customCss?: string): void {
    const existingStyle = document.getElementById('tenant-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (customCss) {
      const styleElement = document.createElement('style');
      styleElement.id = 'tenant-custom-css';
      styleElement.textContent = customCss;
      document.head.appendChild(styleElement);
    }
  }

  private updateDocumentMeta(theme: TenantTheme): void {
    // Update favicon
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (favicon && theme.faviconUrl) {
      favicon.href = theme.faviconUrl;
    }
  }

  generateTailwindConfig(theme: TenantTheme): object {
    return {
      theme: {
        extend: {
          colors: {
            primary: {
              50: this.generateColorScale(theme.colors.primary)[50],
              100: this.generateColorScale(theme.colors.primary)[100],
              200: this.generateColorScale(theme.colors.primary)[200],
              300: this.generateColorScale(theme.colors.primary)[300],
              400: this.generateColorScale(theme.colors.primary)[400],
              500: theme.colors.primary,
              600: this.generateColorScale(theme.colors.primary)[600],
              700: this.generateColorScale(theme.colors.primary)[700],
              800: this.generateColorScale(theme.colors.primary)[800],
              900: this.generateColorScale(theme.colors.primary)[900],
            },
            secondary: {
              50: this.generateColorScale(theme.colors.secondary)[50],
              100: this.generateColorScale(theme.colors.secondary)[100],
              200: this.generateColorScale(theme.colors.secondary)[200],
              300: this.generateColorScale(theme.colors.secondary)[300],
              400: this.generateColorScale(theme.colors.secondary)[400],
              500: theme.colors.secondary,
              600: this.generateColorScale(theme.colors.secondary)[600],
              700: this.generateColorScale(theme.colors.secondary)[700],
              800: this.generateColorScale(theme.colors.secondary)[800],
              900: this.generateColorScale(theme.colors.secondary)[900],
            },
          },
          fontFamily: {
            primary: [theme.fontFamily, 'sans-serif'],
          },
          fontSize: theme.fontSize,
        },
      },
    };
  }

  async preloadTenantAssets(tenantId: string): Promise<void> {
    try {
      // Preload critical assets
      const assetsToPreload = [
        `logo.${this.getImageFormat()}`,
        `favicon.ico`,
        `hero-banner.${this.getImageFormat()}`,
      ];

      const preloadPromises = assetsToPreload.map(asset => 
        this.preloadAsset(`/assets/tenant-assets/${tenantId}/${asset}`)
      );

      await Promise.all(preloadPromises);
      this.assetCache.set(tenantId, assetsToPreload);
    } catch (error) {
      console.warn('Failed to preload tenant assets:', error);
    }
  }

  private preloadAsset(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load ${url}`));
      img.src = url;
    });
  }

  private generateColorScale(baseColor: string): Record<number, string> {
    const colorUtils = new ColorUtils();
    return {
      50: colorUtils.lighten(baseColor, 0.4),
      100: colorUtils.lighten(baseColor, 0.3),
      200: colorUtils.lighten(baseColor, 0.2),
      300: colorUtils.lighten(baseColor, 0.1),
      400: colorUtils.lighten(baseColor, 0.05),
      500: baseColor,
      600: colorUtils.darken(baseColor, 0.05),
      700: colorUtils.darken(baseColor, 0.1),
      800: colorUtils.darken(baseColor, 0.2),
      900: colorUtils.darken(baseColor, 0.3),
    };
  }

  private getDefaultTheme(): TenantTheme {
    return {
      id: 'default',
      tenantId: 'default',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#06b6d4',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        muted: '#64748b',
        border: '#e2e8f0',
        destructive: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
      fontFamily: 'Inter',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      logoUrl: '/assets/shared/logo.png',
      logoAltText: 'Store Logo',
      faviconUrl: '/assets/shared/favicon.ico',
      layoutStyle: 'modern',
      headerStyle: 'sticky',
      sidebarPosition: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private getImageFormat(): string {
    // Detect WebP support
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'webp' : 'png';
  }
}

// Color utility class
class ColorUtils {
  lighten(color: string, amount: number): string {
    return this.adjustColor(color, amount);
  }

  darken(color: string, amount: number): string {
    return this.adjustColor(color, -amount);
  }

  private adjustColor(color: string, amount: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16)
      .slice(1);
  }
}

export { TenantThemeEngine, ColorUtils };
```

### Dynamic Component Theming

```typescript
// shared/hooks/useTheme.ts
import { useTenant } from '../contexts/TenantContext';
import { useMemo } from 'react';

interface ThemeHook {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  getAssetUrl: (assetPath: string) => string;
  getThemedClass: (baseClass: string, variant?: string) => string;
}

export const useTheme = (): ThemeHook => {
  const { theme, tenant, getTenantAsset } = useTenant();

  return useMemo(() => {
    if (!theme) {
      return getDefaultTheme();
    }

    return {
      colors: theme.colors,
      fonts: {
        primary: theme.fontFamily,
        secondary: 'system-ui, sans-serif',
      },
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      },
      getAssetUrl: (assetPath: string) => getTenantAsset(assetPath),
      getThemedClass: (baseClass: string, variant?: string) => {
        if (!variant) return baseClass;
        return `${baseClass} ${baseClass}--${variant}`;
      },
    };
  }, [theme, tenant, getTenantAsset]);
};

function getDefaultTheme(): ThemeHook {
  return {
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#06b6d4',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
      destructive: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
    },
    fonts: {
      primary: 'Inter, sans-serif',
      secondary: 'system-ui, sans-serif',
    },
    spacing: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    },
    getAssetUrl: (assetPath: string) => `/assets/shared/${assetPath}`,
    getThemedClass: (baseClass: string, variant?: string) => {
      if (!variant) return baseClass;
      return `${baseClass} ${baseClass}--${variant}`;
    },
  };
}

// Themed component example
import { cn } from '../lib/utils';

interface ThemedButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  onClick,
}) => {
  const { colors, spacing, borderRadius } = useTheme();

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'text-white shadow-sm hover:opacity-90',
    secondary: 'border border-border hover:bg-muted',
    ghost: 'hover:bg-muted',
  };

  const sizeClasses = {
    sm: `text-sm px-3 py-1.5`,
    md: `text-sm px-4 py-2`,
    lg: `text-base px-6 py-3`,
  };

  const dynamicStyles: React.CSSProperties = {
    backgroundColor: variant === 'primary' ? colors.primary : 
                    variant === 'secondary' ? colors.surface : 'transparent',
    borderColor: variant === 'secondary' ? colors.border : 'transparent',
    borderRadius: borderRadius.md,
    color: variant === 'primary' ? 'white' : colors.text,
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      style={dynamicStyles}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

## Multi-Tenant Routing

### URL Structure Strategy

```typescript
// config/routing.ts
interface RouteStructure {
  // Platform admin routes (SmartSeller management)
  platform: '/platform/*';
  
  // Tenant admin routes (business management)
  tenantAdmin: '/admin/*';
  
  // Storefront routes (customer-facing)
  storefront: {
    // Subdomain approach: tenant.smartseller.com
    subdomain: 'https://{tenant-slug}.smartseller.com/*';
    
    // Path-based approach: smartseller.com/store/{tenant-slug}/*
    pathBased: '/store/{tenant-slug}/*';
    
    // Custom domain: tenant-custom-domain.com/*
    customDomain: 'https://{custom-domain}/*';
  };
}

// URL pattern examples
const urlPatterns = {
  // Platform management
  platformDashboard: '/platform/dashboard',
  tenantManagement: '/platform/tenants',
  platformAnalytics: '/platform/analytics',
  
  // Tenant admin (for tenant: rexus)
  tenantDashboard: '/admin/dashboard',
  productManagement: '/admin/products',
  orderManagement: '/admin/orders',
  
  // Storefront (subdomain approach)
  storefrontHome: 'https://rexus.smartseller.com/',
  productPage: 'https://rexus.smartseller.com/products/gaming-headset',
  cartPage: 'https://rexus.smartseller.com/cart',
  
  // Storefront (path-based approach)
  storefrontHomeAlt: '/store/rexus/',
  productPageAlt: '/store/rexus/products/gaming-headset',
  cartPageAlt: '/store/rexus/cart',
};
```

### Advanced Router Configuration

```typescript
// config/router-config.ts
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { TenantProvider } from '../contexts/TenantContext';

// Platform routes (SmartSeller admin)
const platformRoutes: RouteObject[] = [
  {
    path: '/platform',
    element: <PlatformLayout />,
    children: [
      {
        path: 'dashboard',
        element: <PlatformDashboard />,
      },
      {
        path: 'tenants',
        element: <TenantManagement />,
        children: [
          {
            path: ':tenantId',
            element: <TenantDetails />,
          },
        ],
      },
      {
        path: 'analytics',
        element: <PlatformAnalytics />,
      },
      {
        path: 'billing',
        element: <BillingManagement />,
      },
      {
        path: 'settings',
        element: <SystemConfiguration />,
      },
    ],
  },
];

// Tenant admin routes
const tenantAdminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <TenantProvider>
        <TenantAdminLayout />
      </TenantProvider>
    ),
    loader: async ({ request }) => {
      // Load tenant data based on subdomain or context
      const tenantSlug = extractTenantFromRequest(request);
      return { tenantSlug };
    },
    children: [
      {
        path: 'dashboard',
        element: <TenantDashboard />,
      },
      {
        path: 'products',
        element: <ProductManagement />,
        children: [
          {
            path: 'new',
            element: <ProductForm />,
          },
          {
            path: ':productId',
            element: <ProductDetails />,
          },
        ],
      },
      {
        path: 'orders',
        element: <OrderManagement />,
        children: [
          {
            path: ':orderId',
            element: <OrderDetails />,
          },
        ],
      },
      {
        path: 'customers',
        element: <CustomerManagement />,
      },
      {
        path: 'marketing',
        element: <MarketingTools />,
      },
      {
        path: 'analytics',
        element: <AnalyticsReports />,
      },
      {
        path: 'settings',
        element: <StoreSettings />,
      },
    ],
  },
];

// Storefront routes (customer-facing)
const storefrontRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <TenantProvider>
        <StorefrontLayout />
      </TenantProvider>
    ),
    loader: async ({ request }) => {
      const tenantSlug = extractTenantFromRequest(request);
      return { tenantSlug };
    },
    children: [
      {
        index: true,
        element: <StorefrontHome />,
      },
      {
        path: 'products',
        element: <ProductListing />,
        children: [
          {
            path: ':productSlug',
            element: <ProductDetail />,
          },
        ],
      },
      {
        path: 'categories/:categorySlug',
        element: <CategoryListing />,
      },
      {
        path: 'search',
        element: <SearchResults />,
      },
      {
        path: 'cart',
        element: <ShoppingCart />,
      },
      {
        path: 'checkout',
        element: <Checkout />,
      },
      {
        path: 'account',
        element: <CustomerAccount />,
        children: [
          {
            path: 'profile',
            element: <CustomerProfile />,
          },
          {
            path: 'orders',
            element: <OrderHistory />,
          },
          {
            path: 'addresses',
            element: <AddressBook />,
          },
          {
            path: 'wishlist',
            element: <WishList />,
          },
        ],
      },
      {
        path: 'support',
        element: <CustomerSupport />,
      },
    ],
  },
];

// Utility functions
function extractTenantFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  
  // Try subdomain extraction
  const subdomain = extractSubdomain(url.hostname);
  if (subdomain && subdomain !== 'www') {
    return subdomain;
  }
  
  // Try path-based extraction
  const pathSegments = url.pathname.split('/').filter(Boolean);
  if (pathSegments[0] === 'store' && pathSegments[1]) {
    return pathSegments[1];
  }
  
  // Try custom domain lookup
  return await lookupTenantByDomain(url.hostname);
}

function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

async function lookupTenantByDomain(domain: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/tenants/by-domain/${domain}`);
    if (response.ok) {
      const { tenantSlug } = await response.json();
      return tenantSlug;
    }
  } catch (error) {
    console.error('Domain lookup failed:', error);
  }
  return null;
}

// Create the router
export const createAppRouter = () => {
  return createBrowserRouter([
    ...platformRoutes,
    ...tenantAdminRoutes,
    ...storefrontRoutes,
    {
      path: '*',
      element: <NotFound />,
    },
  ]);
};
```

### Route Protection and Access Control

```typescript
// shared/components/ProtectedRoute.tsx
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../contexts/TenantContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'platform_admin' | 'tenant_admin' | 'customer';
  requiredPermissions?: string[];
  requireTenant?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  requireTenant = true,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const location = useLocation();

  if (isLoading || tenantLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireTenant && !tenant) {
    return <Navigate to="/tenant-not-found" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission =>
      user?.permissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

// Route loading component
const RouteLoading: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Usage in route definitions
const protectedTenantRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="tenant_admin" requireTenant>
        <TenantAdminLayout />
      </ProtectedRoute>
    ),
    children: [
      // ... tenant admin routes
    ],
  },
];
```

## State Management Evolution

### Multi-Tenant State Architecture

```typescript
// shared/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { platformSlice } from '../platform/store/platformSlice';
import { tenantSlice } from '../tenant/store/tenantSlice';
import { authSlice } from './authSlice';
import { cartSlice } from '../tenant/storefront/store/cartSlice';

interface RootState {
  auth: AuthState;
  platform: PlatformState;
  tenant: TenantState;
  cart: CartState;
}

export const createStore = (tenantId?: string) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      platform: platformSlice.reducer,
      tenant: tenantSlice.reducer,
      cart: cartSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['tenant/loadTenant/fulfilled'],
          ignoredPaths: ['tenant.theme.customCss'],
        },
      }).concat([
        // Add tenant-aware middleware
        tenantMiddleware(tenantId),
        // Add cart persistence middleware
        cartPersistenceMiddleware,
      ]),
    preloadedState: {
      // Load tenant-specific initial state
      cart: loadCartFromStorage(tenantId),
    },
  });
};

// Tenant-aware middleware
const tenantMiddleware = (tenantId?: string) => (store: any) => (next: any) => (action: any) => {
  // Add tenant context to all actions
  if (tenantId && action.type && !action.type.startsWith('@@')) {
    action.meta = {
      ...action.meta,
      tenantId,
    };
  }
  
  return next(action);
};

// Cart persistence middleware
const cartPersistenceMiddleware = (store: any) => (next: any) => (action: any) => {
  const result = next(action);
  
  // Persist cart state on cart-related actions
  if (action.type.startsWith('cart/')) {
    const state = store.getState();
    const tenantId = state.tenant.currentTenant?.id;
    if (tenantId) {
      saveCartToStorage(tenantId, state.cart);
    }
  }
  
  return result;
};

function loadCartFromStorage(tenantId?: string): CartState {
  if (!tenantId) return initialCartState;
  
  try {
    const savedCart = localStorage.getItem(`cart_${tenantId}`);
    return savedCart ? JSON.parse(savedCart) : initialCartState;
  } catch {
    return initialCartState;
  }
}

function saveCartToStorage(tenantId: string, cartState: CartState): void {
  try {
    localStorage.setItem(`cart_${tenantId}`, JSON.stringify(cartState));
  } catch (error) {
    console.warn('Failed to save cart to storage:', error);
  }
}
```

### Tenant-Specific State Management

```typescript
// tenant/store/tenantSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TenantConfig, TenantTheme, FeatureFlags } from '../../shared/types/tenant';

interface TenantState {
  currentTenant: TenantConfig | null;
  theme: TenantTheme | null;
  features: FeatureFlags | null;
  loading: boolean;
  error: string | null;
  
  // Tenant admin specific state
  products: Product[];
  orders: Order[];
  customers: Customer[];
  analytics: AnalyticsData | null;
  
  // Storefront specific state
  catalog: ProductCatalog | null;
  categories: Category[];
  promotions: Promotion[];
}

export const loadTenant = createAsyncThunk(
  'tenant/loadTenant',
  async (tenantSlug: string, { rejectWithValue }) => {
    try {
      const [tenantResponse, themeResponse, featuresResponse] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}`),
        fetch(`/api/tenants/${tenantSlug}/theme`),
        fetch(`/api/tenants/${tenantSlug}/features`),
      ]);

      if (!tenantResponse.ok) {
        throw new Error('Tenant not found');
      }

      const [tenant, theme, features] = await Promise.all([
        tenantResponse.json(),
        themeResponse.json(),
        featuresResponse.json(),
      ]);

      return { tenant, theme, features };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load tenant');
    }
  }
);

export const updateTenantConfig = createAsyncThunk(
  'tenant/updateConfig',
  async ({ 
    tenantId, 
    config 
  }: { 
    tenantId: string; 
    config: Partial<TenantConfig> 
  }) => {
    const response = await fetch(`/api/tenants/${tenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to update tenant config');
    }

    return response.json();
  }
);

const tenantSlice = createSlice({
  name: 'tenant',
  initialState: {
    currentTenant: null,
    theme: null,
    features: null,
    loading: false,
    error: null,
    products: [],
    orders: [],
    customers: [],
    analytics: null,
    catalog: null,
    categories: [],
    promotions: [],
  } as TenantState,
  reducers: {
    clearTenant: (state) => {
      state.currentTenant = null;
      state.theme = null;
      state.features = null;
      state.products = [];
      state.orders = [];
      state.customers = [];
      state.analytics = null;
      state.catalog = null;
      state.categories = [];
      state.promotions = [];
    },
    updateTheme: (state, action: PayloadAction<TenantTheme>) => {
      state.theme = action.payload;
    },
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
    },
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
    },
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: string }>) => {
      const order = state.orders.find(o => o.id === action.payload.orderId);
      if (order) {
        order.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTenant = action.payload.tenant;
        state.theme = action.payload.theme;
        state.features = action.payload.features;
      })
      .addCase(loadTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTenantConfig.fulfilled, (state, action) => {
        if (state.currentTenant) {
          state.currentTenant = { ...state.currentTenant, ...action.payload };
        }
      });
  },
});

export const {
  clearTenant,
  updateTheme,
  setProducts,
  addProduct,
  updateProduct,
  setOrders,
  updateOrderStatus,
} = tenantSlice.actions;

export { tenantSlice };
```

## Component Architecture Patterns

### Multi-Tenant Component System

```typescript
// shared/components/TenantAware/TenantAwareComponent.tsx
import React from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useTheme } from '../../hooks/useTheme';

interface TenantAwareComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiresFeature?: string;
}

export const TenantAwareComponent: React.FC<TenantAwareComponentProps> = ({
  children,
  fallback,
  requiresFeature,
}) => {
  const { tenant, features, loading } = useTenant();

  if (loading) {
    return <div className="animate-pulse bg-muted h-8 rounded"></div>;
  }

  if (!tenant) {
    return fallback || <div className="text-muted-foreground">Tenant not found</div>;
  }

  if (requiresFeature && !features?.[requiresFeature]) {
    return fallback || null;
  }

  return <>{children}</>;
};

// Feature-gated component
interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  planRequired?: 'basic' | 'premium' | 'enterprise';
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  planRequired,
}) => {
  const { tenant, features } = useTenant();

  // Check feature availability
  if (!features?.[feature]) {
    return fallback || null;
  }

  // Check plan requirement
  if (planRequired && tenant?.planType) {
    const planLevels = { basic: 1, premium: 2, enterprise: 3 };
    const currentLevel = planLevels[tenant.planType];
    const requiredLevel = planLevels[planRequired];

    if (currentLevel < requiredLevel) {
      return fallback || (
        <div className="text-center py-4 px-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            This feature requires {planRequired} plan
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Themed component wrapper
interface ThemedWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ThemedWrapper: React.FC<ThemedWrapperProps> = ({
  children,
  className,
  style,
}) => {
  const { colors } = useTheme();

  const themedStyle: React.CSSProperties = {
    ...style,
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
  } as React.CSSProperties;

  return (
    <div className={className} style={themedStyle}>
      {children}
    </div>
  );
};
```

### Adaptive UI Components

```typescript
// tenant/storefront/components/layout/StorefrontHeader.tsx
import React from 'react';
import { useTenant } from '../../../../shared/contexts/TenantContext';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { FeatureGate } from '../../../../shared/components/TenantAware/TenantAwareComponent';
import { Button } from '../../../../shared/components/ui/button';
import { Input } from '../../../../shared/components/ui/input';
import { ShoppingCart, Search, User, Menu } from 'lucide-react';

export const StorefrontHeader: React.FC = () => {
  const { tenant, getTenantAsset } = useTenant();
  const { colors, getThemedClass } = useTheme();

  if (!tenant) return null;

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <img
              src={getTenantAsset('logo.png')}
              alt={tenant.storeName}
              className="h-8 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/shared/placeholder-logo.png';
              }}
            />
            <h1 className="text-xl font-bold text-primary hidden sm:block">
              {tenant.storeName}
            </h1>
          </div>

          {/* Search Bar */}
          <FeatureGate feature="search" fallback={<div className="flex-1" />}>
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </FeatureGate>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* User Account */}
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">Account</span>
            </Button>

            {/* Wishlist */}
            <FeatureGate feature="wishlist">
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Wishlist</span>
              </Button>
            </FeatureGate>

            {/* Shopping Cart */}
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">Cart</span>
              <CartBadge />
            </Button>

            {/* Mobile Menu */}
            <Button variant="ghost" size="sm" className="sm:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Menu */}
        <NavigationMenu />
      </div>
    </header>
  );
};

// Cart badge component
const CartBadge: React.FC = () => {
  const cartCount = 3; // This would come from cart state

  if (cartCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
      {cartCount > 99 ? '99+' : cartCount}
    </span>
  );
};

// Dynamic navigation menu
const NavigationMenu: React.FC = () => {
  const { tenant } = useTenant();
  const navigation = tenant?.settings.navigation || [];

  return (
    <nav className="hidden md:block border-t border-border">
      <div className="flex space-x-8 py-4">
        {navigation.map((item) => (
          <a
            key={item.id}
            href={item.url}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            {item.title}
          </a>
        ))}
      </div>
    </nav>
  );
};
```

### Dynamic Product Components

```typescript
// tenant/storefront/components/product/ProductCard.tsx
import React from 'react';
import { Product } from '../../../../shared/types/product';
import { useTenant } from '../../../../shared/contexts/TenantContext';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { FeatureGate } from '../../../../shared/components/TenantAware/TenantAwareComponent';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Badge } from '../../../../shared/components/ui/badge';
import { Button } from '../../../../shared/components/ui/button';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { formatCurrency } from '../../../../shared/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  layout?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onAddToWishlist,
  layout = 'grid',
}) => {
  const { tenant } = useTenant();
  const { colors } = useTheme();

  const isOnSale = product.salePrice && product.salePrice < product.price;
  const discountPercentage = isOnSale
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden rounded-t-lg">
          <img
            src={product.images[0] || '/assets/shared/placeholder-product.png'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {isOnSale && (
            <Badge variant="destructive" className="text-xs">
              -{discountPercentage}%
            </Badge>
          )}
          {product.isNew && (
            <Badge variant="secondary" className="text-xs">
              New
            </Badge>
          )}
          {!product.inStock && (
            <Badge variant="outline" className="text-xs">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <FeatureGate feature="wishlist">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              onAddToWishlist?.(product);
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </FeatureGate>
      </div>

      <CardContent className="p-4">
        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Reviews */}
          <FeatureGate feature="reviews">
            <div className="flex items-center space-x-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(product.rating || 0)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount || 0})
              </span>
            </div>
          </FeatureGate>

          {/* Price */}
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg">
              {formatCurrency(product.salePrice || product.price, tenant?.settings.currency)}
            </span>
            {isOnSale && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.price, tenant?.settings.currency)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              className="flex-1"
              size="sm"
              disabled={!product.inStock}
              onClick={() => onAddToCart?.(product)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>

          {/* Variant Options Preview */}
          {product.variants && product.variants.length > 0 && (
            <div className="pt-2">
              <div className="text-xs text-muted-foreground mb-1">Colors:</div>
              <div className="flex space-x-1">
                {product.variants.slice(0, 5).map((variant, index) => (
                  <div
                    key={variant.id}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: variant.color }}
                    title={variant.name}
                  />
                ))}
                {product.variants.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    +{product.variants.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

## Build & Deployment Strategy

### Multi-Tenant Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@platform': resolve(__dirname, 'src/platform'),
        '@tenant': resolve(__dirname, 'src/tenant'),
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
    build: {
      // Code splitting for multi-tenant architecture
      rollupOptions: {
        output: {
          manualChunks: {
            // Platform admin chunk
            'platform-vendor': ['react', 'react-dom', 'react-router-dom'],
            'platform-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            
            // Tenant admin chunk
            'tenant-admin': [
              'src/tenant/admin/pages/TenantDashboard.tsx',
              'src/tenant/admin/pages/ProductManagement.tsx',
            ],
            
            // Storefront chunk
            'storefront': [
              'src/tenant/storefront/pages/StorefrontHome.tsx',
              'src/tenant/storefront/components/product/ProductCard.tsx',
            ],
            
            // Shared utilities
            'shared-utils': [
              'src/shared/lib/utils.ts',
              'src/shared/hooks/useTenant.ts',
            ],
          },
        },
      },
      // Generate separate CSS files for theming
      cssCodeSplit: true,
      
      // Optimize for multi-tenant performance
      minify: isProduction,
      sourcemap: !isProduction,
    },
    
    // Development server configuration
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    
    // Environment variables
    envPrefix: ['VITE_', 'SMARTSELLER_'],
  };
});
```

### Docker Configuration for Multi-Tenant Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN npm install -g bun && bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy tenant assets directory
COPY --from=builder /app/public/assets/tenant-assets /usr/share/nginx/html/assets/tenant-assets

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css application/javascript application/json application/font-woff application/font-tff image/gif image/png image/jpeg image/svg+xml image/x-icon application/octet-stream;

    # Cache settings
    map $sent_http_content_type $expires {
        default                    off;
        text/html                  epoch;
        text/css                   max;
        application/javascript     max;
        ~image/                    1M;
        ~font/                     1M;
    }

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;
        expires $expires;

        # Handle tenant subdomains and custom domains
        location / {
            try_files $uri $uri/ /index.html;
            
            # Add security headers
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-XSS-Protection "1; mode=block" always;
            add_header X-Content-Type-Options "nosniff" always;
            add_header Referrer-Policy "no-referrer-when-downgrade" always;
            add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
        }

        # API proxy
        location /api/ {
            proxy_pass http://backend-service:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static assets with long cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Tenant assets
        location /assets/tenant-assets/ {
            expires 1d;
            add_header Cache-Control "public";
        }
    }
}
```

### Environment Configuration

```typescript
// config/environment.ts
interface Environment {
  API_BASE_URL: string;
  PLATFORM_DOMAIN: string;
  TENANT_SUBDOMAIN_SUFFIX: string;
  STORAGE_BUCKET: string;
  STRIPE_PUBLIC_KEY: string;
  GOOGLE_ANALYTICS_ID?: string;
  SENTRY_DSN?: string;
  FEATURE_FLAGS: {
    ENABLE_CUSTOM_DOMAINS: boolean;
    ENABLE_MULTI_LANGUAGE: boolean;
    ENABLE_ANALYTICS: boolean;
  };
}

const environments: Record<string, Environment> = {
  development: {
    API_BASE_URL: 'http://localhost:8000',
    PLATFORM_DOMAIN: 'localhost:3000',
    TENANT_SUBDOMAIN_SUFFIX: '.localhost:3000',
    STORAGE_BUCKET: 'smartseller-dev-assets',
    STRIPE_PUBLIC_KEY: 'pk_test_...',
    FEATURE_FLAGS: {
      ENABLE_CUSTOM_DOMAINS: false,
      ENABLE_MULTI_LANGUAGE: true,
      ENABLE_ANALYTICS: true,
    },
  },
  
  staging: {
    API_BASE_URL: 'https://api-staging.smartseller.com',
    PLATFORM_DOMAIN: 'staging.smartseller.com',
    TENANT_SUBDOMAIN_SUFFIX: '.staging.smartseller.com',
    STORAGE_BUCKET: 'smartseller-staging-assets',
    STRIPE_PUBLIC_KEY: 'pk_test_...',
    FEATURE_FLAGS: {
      ENABLE_CUSTOM_DOMAINS: true,
      ENABLE_MULTI_LANGUAGE: true,
      ENABLE_ANALYTICS: true,
    },
  },
  
  production: {
    API_BASE_URL: 'https://api.smartseller.com',
    PLATFORM_DOMAIN: 'smartseller.com',
    TENANT_SUBDOMAIN_SUFFIX: '.smartseller.com',
    STORAGE_BUCKET: 'smartseller-prod-assets',
    STRIPE_PUBLIC_KEY: 'pk_live_...',
    GOOGLE_ANALYTICS_ID: 'G-XXXXXXXXXX',
    SENTRY_DSN: 'https://xxx@sentry.io/xxx',
    FEATURE_FLAGS: {
      ENABLE_CUSTOM_DOMAINS: true,
      ENABLE_MULTI_LANGUAGE: true,
      ENABLE_ANALYTICS: true,
    },
  },
};

export const env = environments[import.meta.env.MODE || 'development'];
```

## Performance Optimization

### Tenant-Specific Performance Strategies

```typescript
// utils/performance.ts
import { useTenant } from '../shared/contexts/TenantContext';
import { useEffect, useState } from 'react';

// Tenant-specific resource preloading
export const useTenantResourcePreloader = () => {
  const { tenant } = useTenant();
  const [preloaded, setPreloaded] = useState(false);

  useEffect(() => {
    if (!tenant || preloaded) return;

    const preloadResources = async () => {
      const criticalResources = [
        `/assets/tenant-assets/${tenant.id}/logo.webp`,
        `/assets/tenant-assets/${tenant.id}/hero-banner.webp`,
        `/api/tenants/${tenant.id}/featured-products`,
      ];

      const preloadPromises = criticalResources.map(async (resource) => {
        if (resource.startsWith('/api/')) {
          // Preload API data
          try {
            const response = await fetch(resource);
            if (response.ok) {
              const data = await response.json();
              // Cache in memory or localStorage
              sessionStorage.setItem(`cache_${resource}`, JSON.stringify(data));
            }
          } catch (error) {
            console.warn(`Failed to preload ${resource}:`, error);
          }
        } else {
          // Preload images
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = resource;
          });
        }
      });

      try {
        await Promise.allSettled(preloadPromises);
        setPreloaded(true);
      } catch (error) {
        console.warn('Resource preloading failed:', error);
      }
    };

    preloadResources();
  }, [tenant, preloaded]);

  return preloaded;
};

// Lazy loading for tenant components
export const TenantLazyLoader = {
  AdminDashboard: React.lazy(() => import('../tenant/admin/pages/TenantDashboard')),
  ProductManagement: React.lazy(() => import('../tenant/admin/pages/ProductManagement')),
  StorefrontHome: React.lazy(() => import('../tenant/storefront/pages/StorefrontHome')),
  ProductDetail: React.lazy(() => import('../tenant/storefront/pages/ProductDetail')),
};

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const { tenant } = useTenant();

  useEffect(() => {
    if (!tenant) return;

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'FCP') {
          // First Contentful Paint
          console.log(`[${tenant.slug}] FCP: ${entry.startTime}ms`);
        }
        
        if (entry.name === 'LCP') {
          // Largest Contentful Paint
          console.log(`[${tenant.slug}] LCP: ${entry.startTime}ms`);
        }
      });
    });

    observer.observe({ type: 'paint', buffered: true });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    return () => observer.disconnect();
  }, [tenant]);
};

// Tenant-specific caching strategy
class TenantCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(tenantId: string, key: string, data: any, ttl: number = 300000) {
    const cacheKey = `${tenantId}:${key}`;
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(tenantId: string, key: string): any | null {
    const cacheKey = `${tenantId}:${key}`;
    const cached = this.cache.get(cacheKey);

    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  clear(tenantId: string) {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${tenantId}:`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const tenantCache = new TenantCache();
```

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up new project structure
- [ ] Implement TenantContext and basic tenant resolution
- [ ] Create shared component library with theming support
- [ ] Migrate existing components to new structure
- [ ] Implement basic multi-tenant routing
- [ ] Set up development environment with hot-reloading

### Phase 2: Core Multi-Tenancy (Weeks 5-8)
- [ ] Implement dynamic theming engine
- [ ] Create tenant admin dashboard foundation
- [ ] Build platform admin interface
- [ ] Implement tenant-aware state management
- [ ] Add feature flagging system
- [ ] Create tenant onboarding flow

### Phase 3: Storefront Enhancement (Weeks 9-12)
- [ ] Build adaptive storefront components
- [ ] Implement tenant-specific product catalog
- [ ] Create customizable checkout process
- [ ] Add customer account management
- [ ] Implement marketing components with tenant customization
- [ ] Add search and filtering capabilities

### Phase 4: Advanced Features (Weeks 13-16)
- [ ] Implement custom domain support
- [ ] Add advanced analytics and reporting
- [ ] Create tenant-specific SEO optimization
- [ ] Implement email template customization
- [ ] Add webhook and API management
- [ ] Performance optimization and monitoring

### Migration Strategy
1. **Parallel Development**: Build new multi-tenant structure alongside existing code
2. **Gradual Migration**: Migrate components one by one to minimize disruption
3. **Feature Flags**: Use feature flags to toggle between old and new implementations
4. **Data Migration**: Plan and execute tenant data separation
5. **Testing**: Comprehensive testing at each phase
6. **User Training**: Train users on new admin interfaces

### Success Metrics
- Page load time < 2 seconds for all tenant storefronts
- Support for 1000+ concurrent tenants
- 99.9% uptime for multi-tenant infrastructure
- Seamless tenant onboarding in < 15 minutes
- Zero data leakage between tenants
- Mobile responsiveness score > 95%

This comprehensive guide provides the foundation for transforming your current single-tenant SmartSeller frontend into a robust multi-tenant B2B SaaS platform. The implementation focuses on maintainability, scalability, and user experience while preserving the existing investment in React, TypeScript, and shadcn/ui components.
