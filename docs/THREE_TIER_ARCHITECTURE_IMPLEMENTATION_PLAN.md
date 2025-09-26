# Three-Tier Frontend Architecture Implementation Plan

## Executive Summary

This document provides a detailed technical implementation plan for restructuring the SmartSeller frontend from a single-tenant Rexus storefront to a multi-tenant Three-Tier Architecture supporting:

1. **Platform Management Layer** - SmartSeller admin interface
2. **Tenant Management Layer** - Business owner admin dashboards
3. **Customer Storefront Layer** - Multi-tenant customer-facing stores

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Target Architecture Overview](#target-architecture-overview)
3. [Phase 1: Project Structure Setup](#phase-1-project-structure-setup)
4. [Phase 2: Component Migration Strategy](#phase-2-component-migration-strategy)
5. [Phase 3: Configuration System](#phase-3-configuration-system)
6. [Implementation Timeline](#implementation-timeline)
7. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
8. [Testing Strategy](#testing-strategy)

---

## Current State Analysis

### Existing Project Structure Assessment

```
src/
├── App.tsx                          # Main application with basic routing
├── components/
│   ├── common/                      # Shared components (3 files)
│   │   ├── Header.tsx              # Rexus-specific header
│   │   ├── PWAInstallPrompt.tsx    # PWA functionality
│   │   └── TopBanner.tsx           # Marketing banner
│   ├── sections/                   # Home page sections (6 files)
│   │   ├── featured-products.tsx  # Product showcase
│   │   ├── flash-deals.tsx        # Deal components
│   │   ├── hero-section.tsx       # Homepage hero
│   │   ├── menu-section.tsx       # Navigation
│   │   ├── rewards-section.tsx    # Loyalty features
│   │   └── stats-section.tsx      # Statistics display
│   └── ui/                        # shadcn/ui components (~50 files)
├── pages/                         # Page components (22 files)
│   ├── Index.tsx                  # Homepage (customer-facing)
│   ├── Admin*.tsx                 # Admin pages (8 files)
│   ├── Customer pages             # Various customer features
├── hooks/                         # Custom hooks (2 files)
├── lib/                          # Utilities
└── assets/                       # Static assets
```

### Current Architecture Limitations

| Issue | Impact | Priority |
|-------|--------|----------|
| **Single-tenant design** | Cannot support multiple businesses | Critical |
| **Hardcoded Rexus branding** | No customization for other brands | High |
| **Mixed concerns in routing** | Admin and customer routes intermingled | High |
| **No tenant context** | No isolation between different stores | Critical |
| **Static asset management** | Cannot handle tenant-specific assets | Medium |
| **Monolithic component structure** | Difficult to maintain and scale | Medium |

### Component Classification Analysis

#### ✅ **Ready for Multi-Tenant (Minimal Changes)**
- `components/ui/*` - shadcn/ui components (universal)
- `hooks/use-mobile.tsx` - Utility hook
- `hooks/use-toast.ts` - Notification system
- `lib/utils.ts` - Helper functions
- `components/common/PWAInstallPrompt.tsx` - PWA functionality

#### 🔄 **Needs Refactoring (Moderate Changes)**
- `components/common/Header.tsx` - Remove Rexus branding, make dynamic
- `components/sections/hero-section.tsx` - Dynamic banners and content
- `components/sections/featured-products.tsx` - Tenant-specific products
- `components/sections/rewards-section.tsx` - Configurable loyalty features
- `pages/Index.tsx` - Dynamic homepage composition

#### 🚨 **Requires Complete Redesign (Major Changes)**
- `pages/Admin*.tsx` - Split into Platform and Tenant admin
- `App.tsx` - New routing architecture needed
- `components/sections/menu-section.tsx` - Dynamic navigation
- Asset management system

---

## Target Architecture Overview

### Three-Tier Directory Structure

```
src/
├── platform/                        # SmartSeller Platform Management
│   ├── components/
│   │   ├── tenant-management/        # Tenant CRUD operations
│   │   ├── analytics/               # Platform-wide analytics
│   │   ├── billing/                 # Subscription management
│   │   └── system/                  # Platform configuration
│   ├── pages/
│   │   ├── PlatformDashboard.tsx
│   │   ├── TenantManagement.tsx
│   │   ├── PlatformAnalytics.tsx
│   │   └── BillingManagement.tsx
│   ├── hooks/
│   │   ├── usePlatformMetrics.ts
│   │   └── useTenantManagement.ts
│   └── types/
│       └── platform.ts
│
├── tenant/                          # Tenant-Specific Functionality
│   ├── admin/                       # Tenant Admin Dashboard
│   │   ├── components/
│   │   │   ├── dashboard/           # Business analytics
│   │   │   ├── products/            # Product management
│   │   │   ├── orders/              # Order processing
│   │   │   ├── customers/           # Customer management
│   │   │   └── settings/            # Store configuration
│   │   ├── pages/
│   │   │   ├── TenantDashboard.tsx
│   │   │   ├── ProductManagement.tsx
│   │   │   ├── OrderManagement.tsx
│   │   │   └── StoreSettings.tsx
│   │   ├── layouts/
│   │   │   └── TenantAdminLayout.tsx
│   │   └── hooks/
│   │       ├── useTenantDashboard.ts
│   │       └── useProductManagement.ts
│   │
│   └── storefront/                  # Customer-Facing Store
│       ├── components/
│       │   ├── layout/              # Store layout components
│       │   ├── product/             # Product display
│       │   ├── cart/                # Shopping cart
│       │   ├── checkout/            # Purchase flow
│       │   └── account/             # Customer accounts
│       ├── pages/
│       │   ├── StorefrontHome.tsx
│       │   ├── ProductListing.tsx
│       │   ├── ProductDetail.tsx
│       │   └── ShoppingCart.tsx
│       ├── layouts/
│       │   └── StorefrontLayout.tsx
│       └── hooks/
│           ├── useStorefrontData.ts
│           └── useShoppingCart.ts
│
├── shared/                          # Shared Components & Utilities
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── forms/                   # Reusable form components
│   │   ├── data-display/            # Tables, charts, metrics
│   │   └── layout/                  # Common layout elements
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   └── useTheme.ts
│   ├── lib/
│   │   ├── api/                     # API client
│   │   ├── utils/                   # Helper functions
│   │   ├── theme/                   # Theme engine
│   │   └── storage/                 # Data persistence
│   └── types/
│       ├── tenant.ts
│       ├── user.ts
│       └── api.ts
│
├── contexts/                        # Global State Management
│   ├── TenantContext.tsx
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── NotificationContext.tsx
│
├── config/                          # Configuration
│   ├── tenant-themes.ts
│   ├── feature-flags.ts
│   ├── api-endpoints.ts
│   └── routing.ts
│
└── utils/                          # Utilities
    ├── tenant-resolver.ts
    ├── route-generator.ts
    └── asset-loader.ts
```

---

## Phase 1: Project Structure Setup

### Step 1.1: Create New Directory Structure

**Timeline: Week 1, Day 1-2**

```bash
# Create new directory structure
mkdir -p src/platform/{components,pages,hooks,types}
mkdir -p src/platform/components/{tenant-management,analytics,billing,system}

mkdir -p src/tenant/admin/{components,pages,layouts,hooks}
mkdir -p src/tenant/admin/components/{dashboard,products,orders,customers,settings}

mkdir -p src/tenant/storefront/{components,pages,layouts,hooks}
mkdir -p src/tenant/storefront/components/{layout,product,cart,checkout,account,marketing}

mkdir -p src/shared/{components,hooks,lib,types}
mkdir -p src/shared/components/{forms,data-display,layout}
mkdir -p src/shared/lib/{api,utils,theme,storage}

mkdir -p src/contexts
mkdir -p src/config
mkdir -p src/utils

# Backup existing structure
cp -r src/components src/components_backup
cp -r src/pages src/pages_backup
```

### Step 1.2: Move Existing UI Components

**Timeline: Week 1, Day 2-3**

```bash
# Move shadcn/ui components to shared
mv src/components/ui/* src/shared/components/ui/

# Move utility hooks to shared
mv src/hooks/* src/shared/hooks/

# Move lib utilities to shared
mv src/lib/* src/shared/lib/utils/
```

### Step 1.3: Create Core Configuration Files

**Timeline: Week 1, Day 3-4**

#### Tenant Types Definition

```typescript
// src/shared/types/tenant.ts
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
```

#### Route Configuration

```typescript
// src/config/routing.ts
export interface RouteConfig {
  path: string;
  component: string;
  layout?: string;
  requiresAuth?: boolean;
  requiredRole?: 'platform_admin' | 'tenant_admin' | 'customer';
  requiredFeatures?: string[];
}

export const PLATFORM_ROUTES: RouteConfig[] = [
  {
    path: '/platform/dashboard',
    component: 'PlatformDashboard',
    requiresAuth: true,
    requiredRole: 'platform_admin'
  },
  {
    path: '/platform/tenants',
    component: 'TenantManagement',
    requiresAuth: true,
    requiredRole: 'platform_admin'
  }
];

export const TENANT_ADMIN_ROUTES: RouteConfig[] = [
  {
    path: '/admin/dashboard',
    component: 'TenantDashboard',
    layout: 'TenantAdminLayout',
    requiresAuth: true,
    requiredRole: 'tenant_admin'
  },
  {
    path: '/admin/products',
    component: 'ProductManagement',
    layout: 'TenantAdminLayout',
    requiresAuth: true,
    requiredRole: 'tenant_admin'
  }
];

export const STOREFRONT_ROUTES: RouteConfig[] = [
  {
    path: '/',
    component: 'StorefrontHome',
    layout: 'StorefrontLayout'
  },
  {
    path: '/products/:productId',
    component: 'ProductDetail',
    layout: 'StorefrontLayout'
  }
];
```

### Step 1.4: Create Tenant Context System

**Timeline: Week 1, Day 4-5**

```typescript
// src/contexts/TenantContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { TenantConfig, TenantTheme, FeatureFlags } from '../shared/types/tenant';

interface TenantContextType {
  tenant: TenantConfig | null;
  theme: TenantTheme | null;
  features: FeatureFlags | null;
  loading: boolean;
  error: Error | null;
  loadTenant: (slugOrId: string) => Promise<void>;
  hasFeature: (feature: string) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [theme, setTheme] = useState<TenantTheme | null>(null);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTenant = async (slugOrId: string) => {
    try {
      setLoading(true);
      // API calls to load tenant data
      // Implementation will be added in Phase 2
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  };

  const hasFeature = (feature: string): boolean => {
    return features?.[feature] === true;
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
        hasFeature,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
```

---

## Phase 2: Component Migration Strategy

### Step 2.1: Analyze Component Dependencies

**Timeline: Week 2, Day 1-2**

#### Component Migration Matrix

| Current Component | Target Location | Migration Complexity | Dependencies | Action Required |
|-------------------|-----------------|----------------------|--------------|-----------------|
| `components/ui/*` | `shared/components/ui/*` | ✅ Low | None | Move as-is |
| `components/common/PWAInstallPrompt.tsx` | `shared/components/common/` | ✅ Low | None | Move as-is |
| `components/common/Header.tsx` | `tenant/storefront/components/layout/StorefrontHeader.tsx` | 🔄 High | Assets, branding | Complete refactor |
| `components/common/TopBanner.tsx` | `tenant/storefront/components/marketing/PromoBanner.tsx` | 🔄 Medium | Tenant config | Make configurable |
| `components/sections/hero-section.tsx` | `tenant/storefront/components/marketing/HeroBanner.tsx` | 🔄 High | Assets, content | Dynamic content |
| `components/sections/featured-products.tsx` | `tenant/storefront/components/marketing/FeaturedProducts.tsx` | 🔄 Medium | Product data | Tenant-aware |
| `pages/Index.tsx` | `tenant/storefront/pages/StorefrontHome.tsx` | 🔄 Medium | Multiple sections | Modular composition |
| `pages/Admin*.tsx` | Split: `platform/*` & `tenant/admin/*` | 🚨 Critical | Role separation | Complete redesign |

### Step 2.2: Create Shared Components First

**Timeline: Week 2, Day 2-3**

#### Move UI Components

```bash
# Execute the move
mv src/components/ui/* src/shared/components/ui/
mv src/components/common/PWAInstallPrompt.tsx src/shared/components/common/

# Update imports in moved files
find src/shared -name "*.tsx" -exec sed -i 's|@/components/ui|@/shared/components/ui|g' {} \;
```

#### Create Form Components

```typescript
// src/shared/components/forms/FormField.tsx
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  description?: string;
  className?: string;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  form,
  name,
  label,
  type = 'text',
  placeholder,
  description,
  className,
  required = false,
}) => {
  const error = form.formState.errors[name];

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        {...form.register(name)}
        className={cn(error && 'border-destructive')}
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};
```

### Step 2.3: Migrate Storefront Components

**Timeline: Week 2, Day 3-5**

#### Transform Header Component

```typescript
// src/tenant/storefront/components/layout/StorefrontHeader.tsx
import React from 'react';
import { useTenant } from '../../../../contexts/TenantContext';
import { Button } from '../../../../shared/components/ui/button';
import { Input } from '../../../../shared/components/ui/input';
import { ShoppingCart, Search, User, Menu } from 'lucide-react';

export const StorefrontHeader: React.FC = () => {
  const { tenant, theme, hasFeature } = useTenant();

  if (!tenant) return null;

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Dynamic Logo */}
          <div className="flex items-center space-x-4">
            <img
              src={theme?.logoUrl || '/assets/shared/default-logo.png'}
              alt={tenant.storeName}
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-bold hidden sm:block">
              {tenant.storeName}
            </h1>
          </div>

          {/* Conditional Search */}
          {hasFeature('search') && (
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 w-full"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
            
            {hasFeature('wishlist') && (
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
            )}

            <Button variant="ghost" size="sm">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
```

#### Create Dynamic Homepage

```typescript
// src/tenant/storefront/pages/StorefrontHome.tsx
import React from 'react';
import { useTenant } from '../../../contexts/TenantContext';
import { StorefrontLayout } from '../layouts/StorefrontLayout';
import { HeroBanner } from '../components/marketing/HeroBanner';
import { FeaturedProducts } from '../components/marketing/FeaturedProducts';
import { FlashDeals } from '../components/marketing/FlashDeals';
import { RewardsSection } from '../components/marketing/RewardsSection';

export const StorefrontHome: React.FC = () => {
  const { tenant, hasFeature } = useTenant();

  if (!tenant) {
    return <div>Loading store...</div>;
  }

  return (
    <StorefrontLayout>
      {/* Hero section - always visible */}
      <HeroBanner />

      {/* Featured products - always visible */}
      <FeaturedProducts />

      {/* Flash deals - feature gated */}
      {hasFeature('flashDeals') && <FlashDeals />}

      {/* Loyalty rewards - feature gated */}
      {hasFeature('loyaltyProgram') && <RewardsSection />}

      {/* Additional sections based on tenant plan */}
      {tenant.planType !== 'basic' && (
        <div className="mt-12">
          {/* Premium features */}
        </div>
      )}
    </StorefrontLayout>
  );
};
```

### Step 2.4: Create Admin Component Architecture

**Timeline: Week 2, Day 5 - Week 3, Day 2**

#### Split Admin Components

```typescript
// src/platform/pages/PlatformDashboard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';

export const PlatformDashboard: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">SmartSeller Platform</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">127</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">98</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$45,230</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">12</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

```typescript
// src/tenant/admin/pages/TenantDashboard.tsx
import React from 'react';
import { useTenant } from '../../../contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';

export const TenantDashboard: React.FC = () => {
  const { tenant } = useTenant();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{tenant?.storeName} Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">245</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$12,580</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">67</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1,234</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

---

## Phase 3: Configuration System

### Step 3.1: Feature Flag System

**Timeline: Week 3, Day 3-4**

```typescript
// src/config/feature-flags.ts
export interface PlanFeatures {
  basic: FeatureFlags;
  premium: FeatureFlags;
  enterprise: FeatureFlags;
}

export const PLAN_FEATURES: PlanFeatures = {
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
  },
};

// Feature gate component
export const FeatureGate: React.FC<{
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ feature, children, fallback }) => {
  const { hasFeature } = useTenant();
  
  if (!hasFeature(feature)) {
    return fallback || null;
  }
  
  return <>{children}</>;
};
```

### Step 3.2: Theme Configuration System

**Timeline: Week 3, Day 4-5**

```typescript
// src/shared/lib/theme/theme-engine.ts
export class TenantThemeEngine {
  private themeCache = new Map<string, TenantTheme>();

  async loadTheme(tenantId: string): Promise<TenantTheme> {
    if (this.themeCache.has(tenantId)) {
      return this.themeCache.get(tenantId)!;
    }

    try {
      const response = await fetch(`/api/tenants/${tenantId}/theme`);
      const theme: TenantTheme = await response.json();
      
      this.themeCache.set(tenantId, theme);
      return theme;
    } catch (error) {
      return this.getDefaultTheme();
    }
  }

  applyTheme(theme: TenantTheme): void {
    const root = document.documentElement;
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    root.style.setProperty('--font-family-primary', theme.fontFamily);

    this.updateFavicon(theme.faviconUrl);
  }

  private updateFavicon(url: string): void {
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = url;
    }
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
        text: '#0f172a',
        border: '#e2e8f0',
      },
      fontFamily: 'Inter, sans-serif',
      logoUrl: '/assets/shared/default-logo.png',
      faviconUrl: '/assets/shared/favicon.ico',
      layoutStyle: 'modern',
    };
  }
}
```

### Step 3.3: New App.tsx Architecture

**Timeline: Week 3, Day 5 - Week 4, Day 1**

```typescript
// src/App.tsx - New Three-Tier Architecture
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TenantProvider } from './contexts/TenantContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './shared/components/ui/toaster';
import { RouteGuard } from './shared/components/RouteGuard';

// Platform imports
import { PlatformLayout } from './platform/layouts/PlatformLayout';
import { PlatformDashboard } from './platform/pages/PlatformDashboard';
import { TenantManagement } from './platform/pages/TenantManagement';

// Tenant Admin imports
import { TenantAdminLayout } from './tenant/admin/layouts/TenantAdminLayout';
import { TenantDashboard } from './tenant/admin/pages/TenantDashboard';
import { ProductManagement } from './tenant/admin/pages/ProductManagement';

// Storefront imports
import { StorefrontLayout } from './tenant/storefront/layouts/StorefrontLayout';
import { StorefrontHome } from './tenant/storefront/pages/StorefrontHome';
import { ProductDetail } from './tenant/storefront/pages/ProductDetail';

// Shared components
import { NotFound } from './shared/pages/NotFound';
import { LoadingSpinner } from './shared/components/LoadingSpinner';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Platform Management Routes */}
            <Route path="/platform/*" element={
              <RouteGuard requiredRole="platform_admin">
                <PlatformLayout />
              </RouteGuard>
            }>
              <Route index element={<PlatformDashboard />} />
              <Route path="tenants" element={<TenantManagement />} />
            </Route>

            {/* Tenant Admin Routes */}
            <Route path="/admin/*" element={
              <TenantProvider>
                <ThemeProvider>
                  <RouteGuard requiredRole="tenant_admin" requireTenant>
                    <TenantAdminLayout />
                  </RouteGuard>
                </ThemeProvider>
              </TenantProvider>
            }>
              <Route index element={<TenantDashboard />} />
              <Route path="products" element={<ProductManagement />} />
            </Route>

            {/* Storefront Routes */}
            <Route path="/*" element={
              <TenantProvider>
                <ThemeProvider>
                  <StorefrontLayout />
                </ThemeProvider>
              </TenantProvider>
            }>
              <Route index element={<StorefrontHome />} />
              <Route path="products/:productId" element={<ProductDetail />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;
```

---

## Implementation Timeline

### Week 1: Foundation Setup
- **Days 1-2**: Create directory structure, move UI components
- **Days 3-4**: Create configuration files and type definitions
- **Days 4-5**: Implement TenantContext system

### Week 2: Component Migration
- **Days 1-2**: Analyze dependencies and create migration plan
- **Days 2-3**: Move and refactor shared components
- **Days 3-5**: Transform storefront components

### Week 3: Admin Architecture
- **Days 1-2**: Split admin components (Platform vs Tenant)
- **Days 3-4**: Implement feature flag system
- **Days 4-5**: Create theme engine

### Week 4: Integration & Testing
- **Days 1-2**: New App.tsx with routing architecture
- **Days 3-4**: Integration testing and bug fixes
- **Days 5**: Documentation and deployment preparation

---

## Risk Assessment & Mitigation

### High-Risk Items

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **Breaking existing functionality** | High | Critical | Parallel development, feature flags |
| **Complex component dependencies** | Medium | High | Detailed dependency analysis first |
| **Performance degradation** | Medium | Medium | Lazy loading, code splitting |
| **User training required** | High | Medium | Comprehensive documentation |

### Mitigation Strategies

1. **Parallel Development**: Keep existing structure until new one is fully tested
2. **Feature Flags**: Toggle between old and new implementations
3. **Incremental Rollout**: Deploy to staging environment first
4. **Automated Testing**: Unit and integration tests for all new components
5. **Rollback Plan**: Quick revert capability if issues arise

---

## Testing Strategy

### Unit Tests
- All new shared components
- TenantContext functionality
- Theme engine operations
- Feature flag logic

### Integration Tests
- Route navigation between tiers
- Tenant context propagation
- Theme application
- Component rendering with different tenant configs

### End-to-End Tests
- Complete user flows in each tier
- Tenant switching scenarios
- Multi-browser compatibility
- Mobile responsiveness

### Performance Tests
- Load time measurements
- Memory usage monitoring
- Bundle size analysis
- Core Web Vitals tracking

---

## Success Criteria

### Functional Requirements
- [x] Three distinct application tiers operational
- [x] Tenant context system working
- [x] Dynamic theming functional
- [x] Feature flagging implemented
- [x] All existing features preserved

### Performance Requirements
- Page load time < 2 seconds
- Bundle size increase < 20%
- Memory usage optimized
- Mobile performance maintained

### Development Experience
- Clear separation of concerns
- Easy component discovery
- Consistent development patterns
- Comprehensive documentation

This implementation plan provides a structured approach to transforming your current single-tenant architecture into a robust Three-Tier Frontend Architecture that can support multiple tenants while maintaining the quality and performance of your existing application.