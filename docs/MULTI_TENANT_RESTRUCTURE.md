# SmartSeller Multi-Tenant Architecture Restructure Plan

## Executive Summary

This document outlines the comprehensive plan to transform the current single-tenant SmartSeller application into a scalable multi-tenant B2B SaaS platform. The restructure will enable multiple businesses to operate their own storefronts while sharing common infrastructure and administrative tools.

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Multi-Tenant Architecture Goals](#multi-tenant-architecture-goals)
3. [Technical Transformation Plan](#technical-transformation-plan)
4. [Frontend Restructure Strategy](#frontend-restructure-strategy)
5. [Backend Architecture Changes](#backend-architecture-changes)
6. [Database Schema Redesign](#database-schema-redesign)
7. [Security and Isolation](#security-and-isolation)
8. [Migration Strategy](#migration-strategy)
9. [Implementation Phases](#implementation-phases)
10. [Performance and Scaling](#performance-and-scaling)

## Current State Analysis

### Existing Architecture Limitations

#### 1. **Single-Tenant Design**
```typescript
// Current hardcoded tenant-specific implementation
const Header = () => (
  <header>
    <img src="/rexus-logo.png" alt="Rexus Gaming" />
    <h1>Rexus Gaming Store</h1>
  </header>
);

// Hardcoded theme colors in Tailwind config
const theme = {
  colors: {
    primary: '#3b82f6', // Rexus blue
    secondary: '#64748b',
  }
};
```

#### 2. **Static Configuration**
- Hardcoded branding and themes
- Fixed product categories (gaming peripherals)
- Single database schema without tenant isolation
- No dynamic routing for multiple storefronts

#### 3. **Monolithic Frontend Structure**
```
src/
├── components/           # Single set of components
├── pages/               # Rexus-specific pages
├── assets/              # Rexus branding assets
└── lib/                 # Shared utilities
```

### Identified Pain Points

1. **Scalability**: Cannot support multiple businesses
2. **Customization**: No dynamic theming or branding
3. **Data Isolation**: Shared database without tenant boundaries
4. **Deployment**: Single deployment for all tenants
5. **Performance**: No tenant-specific optimizations

## Multi-Tenant Architecture Goals

### Primary Objectives

#### 1. **Tenant Isolation**
- **Data Isolation**: Complete separation of tenant data
- **Customization Isolation**: Independent themes, branding, and configuration
- **Performance Isolation**: Tenant-specific caching and optimization
- **Security Isolation**: Proper access controls and authentication boundaries

#### 2. **Scalability**
- Support for 1000+ concurrent tenants
- Horizontal scaling capabilities
- Efficient resource utilization
- Auto-scaling based on tenant load

#### 3. **Customization**
- Dynamic theming and branding
- Configurable product categories and features
- Custom domain support
- White-label capabilities

#### 4. **Developer Experience**
- Clean separation of platform and tenant-specific code
- Easy tenant onboarding process
- Comprehensive admin tools for platform management
- Simplified deployment and maintenance

## Technical Transformation Plan

### Architecture Pattern Selection

We will implement a **Hybrid Multi-Tenant Architecture** combining:

1. **Shared Application, Separate Databases** (Primary Pattern)
2. **Shared Resources with Tenant Isolation**
3. **Microservices for Scalability**

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                             │
├─────────────────────────────────────────────────────────────┤
│                    API Gateway                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │ Tenant Router   │  │ Auth Service    │  │ Rate Limiter │  │
│  └─────────────────┘  └─────────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Frontend (React Multi-Tenant)                │ │
│  │  ┌───────────────┐  ┌────────────────┐  ┌─────────────┐ │ │
│  │  │ Platform      │  │ Tenant Admin   │  │ Storefront  │ │ │
│  │  │ Management    │  │ Dashboard      │  │ (Customer)  │ │ │
│  │  └───────────────┘  └────────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Backend Services                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │ Tenant Service  │  │ Product Service │  │ Order Service│  │
│  └─────────────────┘  └─────────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │ Platform DB     │  │ Tenant A DB     │  │ Tenant B DB  │  │
│  │ (Shared)        │  │ (Isolated)      │  │ (Isolated)   │  │
│  └─────────────────┘  └─────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Restructure Strategy

### New Project Structure

```
src/
├── platform/                    # Platform management (SmartSeller admin)
│   ├── components/
│   │   ├── tenant-management/
│   │   ├── analytics/
│   │   └── billing/
│   ├── pages/
│   │   ├── TenantList.tsx
│   │   ├── PlatformAnalytics.tsx
│   │   └── SystemSettings.tsx
│   └── hooks/
│       └── usePlatformData.ts
├── tenant/                      # Tenant-specific functionality
│   ├── admin/                   # Tenant admin dashboard
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   └── customers/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ProductManagement.tsx
│   │   │   └── OrderManagement.tsx
│   │   └── hooks/
│   │       └── useTenantAdmin.ts
│   └── storefront/              # Customer-facing store
│       ├── components/
│       │   ├── product-catalog/
│       │   ├── shopping-cart/
│       │   └── user-profile/
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── ProductDetail.tsx
│       │   └── Checkout.tsx
│       └── hooks/
│           └── useStorefront.ts
├── shared/                      # Shared components and utilities
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── forms/              # Reusable forms
│   │   └── layouts/            # Layout components
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   └── useTheme.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   └── types/
│       ├── tenant.ts
│       ├── user.ts
│       └── product.ts
├── contexts/                    # Global contexts
│   ├── TenantContext.tsx
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
└── config/                      # Configuration files
    ├── tenant-themes.ts
    ├── feature-flags.ts
    └── api-endpoints.ts
```

### Multi-Tenant Context System

```typescript
// contexts/TenantContext.tsx
interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: Error | null;
  switchTenant: (tenantId: string) => Promise<void>;
  updateTenantConfig: (config: Partial<TenantConfig>) => Promise<void>;
}

export const TenantContext = createContext<TenantContextType>();

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize tenant from URL or user context
  useEffect(() => {
    const initializeTenant = async () => {
      try {
        const tenantId = extractTenantFromUrl() || getCurrentUserTenant();
        if (tenantId) {
          const tenantData = await fetchTenant(tenantId);
          setTenant(tenantData);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    initializeTenant();
  }, []);

  const switchTenant = async (tenantId: string) => {
    setLoading(true);
    try {
      const tenantData = await fetchTenant(tenantId);
      setTenant(tenantData);
      // Update URL and local storage
      updateTenantInUrl(tenantId);
      localStorage.setItem('current-tenant', tenantId);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const updateTenantConfig = async (config: Partial<TenantConfig>) => {
    if (!tenant) return;
    
    const updatedTenant = await updateTenant(tenant.id, config);
    setTenant(updatedTenant);
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        error,
        switchTenant,
        updateTenantConfig,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
```

### Dynamic Theme System

```typescript
// shared/hooks/useTheme.ts
interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  logo: string;
  favicon: string;
  customCss?: string;
}

export const useTheme = () => {
  const { tenant } = useTenant();
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    if (tenant?.themeConfig) {
      setTheme(tenant.themeConfig);
      applyThemeToDOM(tenant.themeConfig);
    }
  }, [tenant]);

  const applyThemeToDOM = (themeConfig: ThemeConfig) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--color-primary', themeConfig.primary);
    root.style.setProperty('--color-secondary', themeConfig.secondary);
    root.style.setProperty('--color-accent', themeConfig.accent);
    
    // Update favicon and title
    updateFavicon(themeConfig.favicon);
    document.title = tenant?.name || 'SmartSeller Store';
    
    // Apply custom CSS if provided
    if (themeConfig.customCss) {
      applyCustomCSS(themeConfig.customCss);
    }
  };

  return { theme, applyTheme: applyThemeToDOM };
};
```

### Multi-Tenant Routing

```typescript
// App.tsx - Updated routing structure
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <AuthProvider>
          <ThemeProvider>
            <BrowserRouter>
              <Routes>
                {/* Platform Management Routes */}
                <Route path="/platform" element={<PlatformLayout />}>
                  <Route index element={<PlatformDashboard />} />
                  <Route path="tenants" element={<TenantManagement />} />
                  <Route path="analytics" element={<PlatformAnalytics />} />
                  <Route path="billing" element={<BillingManagement />} />
                </Route>

                {/* Tenant-specific Routes */}
                <Route path="/:tenantSlug" element={<TenantResolver />}>
                  {/* Storefront Routes */}
                  <Route index element={<StorefrontHome />} />
                  <Route path="products/:productId" element={<ProductDetail />} />
                  <Route path="cart" element={<ShoppingCart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="profile" element={<CustomerProfile />} />
                  
                  {/* Tenant Admin Routes */}
                  <Route path="admin" element={<TenantAdminLayout />}>
                    <Route index element={<TenantDashboard />} />
                    <Route path="products" element={<ProductManagement />} />
                    <Route path="orders" element={<OrderManagement />} />
                    <Route path="customers" element={<CustomerManagement />} />
                    <Route path="settings" element={<TenantSettings />} />
                  </Route>
                </Route>

                {/* Default redirect and error handling */}
                <Route path="/" element={<TenantSelector />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
};

// TenantResolver component
const TenantResolver = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { switchTenant, loading, error, tenant } = useTenant();

  useEffect(() => {
    if (tenantSlug && (!tenant || tenant.slug !== tenantSlug)) {
      switchTenant(tenantSlug);
    }
  }, [tenantSlug, tenant, switchTenant]);

  if (loading) return <TenantLoadingSpinner />;
  if (error) return <TenantErrorPage error={error} />;
  if (!tenant) return <TenantNotFound />;

  return <Outlet />;
};
```

## Backend Architecture Changes

### Microservices Architecture

```typescript
// Proposed backend services structure

// 1. Tenant Management Service
interface TenantService {
  createTenant(data: CreateTenantData): Promise<Tenant>;
  getTenant(id: string): Promise<Tenant>;
  updateTenant(id: string, data: Partial<TenantConfig>): Promise<Tenant>;
  listTenants(filters: TenantFilters): Promise<TenantList>;
  deleteTenant(id: string): Promise<void>;
}

// 2. Authentication Service
interface AuthService {
  authenticateUser(credentials: LoginCredentials): Promise<AuthResult>;
  validateToken(token: string): Promise<User>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  createUser(userData: CreateUserData, tenantId: string): Promise<User>;
}

// 3. Product Service
interface ProductService {
  createProduct(data: ProductData, tenantId: string): Promise<Product>;
  getProducts(tenantId: string, filters: ProductFilters): Promise<ProductList>;
  updateProduct(id: string, data: Partial<ProductData>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
}

// 4. Order Service
interface OrderService {
  createOrder(data: OrderData, tenantId: string): Promise<Order>;
  getOrders(tenantId: string, filters: OrderFilters): Promise<OrderList>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
  processPayment(orderId: string, paymentData: PaymentData): Promise<PaymentResult>;
}
```

### API Gateway Configuration

```typescript
// API Gateway routing configuration
const apiRoutes = {
  // Platform management endpoints
  '/api/platform/*': {
    service: 'platform-service',
    auth: 'platform-admin',
    rateLimit: '100/hour',
  },
  
  // Tenant-specific endpoints
  '/api/tenants/:tenantId/*': {
    service: 'tenant-service',
    auth: 'tenant-context',
    rateLimit: '1000/hour',
    middleware: ['tenant-resolver', 'tenant-isolation'],
  },
  
  // Public storefront endpoints
  '/api/storefront/:tenantSlug/*': {
    service: 'storefront-service',
    auth: 'optional',
    rateLimit: '5000/hour',
    cache: '5m',
  },
};

// Tenant isolation middleware
const tenantIsolationMiddleware = (req, res, next) => {
  const tenantId = req.params.tenantId || req.headers['x-tenant-id'];
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID required' });
  }
  
  // Validate tenant access
  if (!hasAccessToTenant(req.user, tenantId)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Set tenant context for database queries
  req.tenantContext = { tenantId };
  next();
};
```

## Database Schema Redesign

### Multi-Tenant Database Strategy

#### Option 1: Separate Databases per Tenant (Recommended)

```sql
-- Platform database (shared)
CREATE DATABASE smartseller_platform;
USE smartseller_platform;

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    database_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(20) DEFAULT 'active',
    theme_config JSONB,
    feature_flags JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE platform_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'platform_admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenant_access (
    user_id UUID REFERENCES platform_users(id),
    tenant_id UUID REFERENCES tenants(id),
    role VARCHAR(50) NOT NULL,
    permissions JSONB,
    PRIMARY KEY (user_id, tenant_id)
);

-- Tenant-specific database template
CREATE TEMPLATE smartseller_tenant_template;
USE smartseller_tenant_template;

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID,
    inventory_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);
```

#### Database Connection Management

```typescript
// shared/lib/database.ts
interface DatabaseConnection {
  host: string;
  database: string;
  user: string;
  password: string;
}

class TenantDatabaseManager {
  private connections: Map<string, DatabaseConnection> = new Map();

  async getTenantConnection(tenantId: string): Promise<DatabaseConnection> {
    if (!this.connections.has(tenantId)) {
      const tenant = await this.getTenantInfo(tenantId);
      const connection = {
        host: process.env.DB_HOST,
        database: tenant.database_name,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      };
      this.connections.set(tenantId, connection);
    }
    
    return this.connections.get(tenantId);
  }

  async createTenantDatabase(tenantId: string, tenantSlug: string): Promise<void> {
    const databaseName = `smartseller_${tenantSlug}`;
    
    // Create database from template
    await this.executeQuery(
      `CREATE DATABASE ${databaseName} WITH TEMPLATE smartseller_tenant_template`
    );
    
    // Update tenant record with database name
    await this.updateTenant(tenantId, { database_name: databaseName });
  }
}
```

## Security and Isolation

### Multi-Tenant Security Model

#### 1. **Authentication & Authorization**

```typescript
// shared/lib/auth.ts
interface AuthContext {
  user: User;
  tenant: Tenant;
  permissions: Permission[];
  role: Role;
}

class MultiTenantAuth {
  async validateRequest(req: Request): Promise<AuthContext> {
    const token = this.extractToken(req);
    const tenantId = this.extractTenantId(req);
    
    // Validate JWT token
    const user = await this.validateToken(token);
    
    // Validate tenant access
    const tenant = await this.validateTenantAccess(user.id, tenantId);
    
    // Get user permissions for this tenant
    const permissions = await this.getUserPermissions(user.id, tenantId);
    
    return {
      user,
      tenant,
      permissions,
      role: user.role,
    };
  }

  async validateTenantAccess(userId: string, tenantId: string): Promise<Tenant> {
    const access = await db.query(`
      SELECT t.*, ta.role, ta.permissions
      FROM tenants t
      JOIN tenant_access ta ON t.id = ta.tenant_id
      WHERE ta.user_id = $1 AND t.id = $2 AND t.status = 'active'
    `, [userId, tenantId]);

    if (!access.rows.length) {
      throw new UnauthorizedError('Access denied to tenant');
    }

    return access.rows[0];
  }
}
```

#### 2. **Data Isolation**

```typescript
// shared/lib/database-isolation.ts
class DataIsolationLayer {
  async query(sql: string, params: any[], context: AuthContext): Promise<any> {
    // Ensure all queries include tenant isolation
    const isolatedSql = this.addTenantIsolation(sql, context.tenant.id);
    
    // Use tenant-specific database connection
    const connection = await this.getTenantConnection(context.tenant.id);
    
    return await connection.query(isolatedSql, params);
  }

  private addTenantIsolation(sql: string, tenantId: string): string {
    // For shared table approach (if used)
    // Add WHERE tenant_id = ? to all queries
    
    // For separate database approach
    // Ensure connection is to correct tenant database
    return sql; // No modification needed for separate DB approach
  }
}
```

#### 3. **API Security**

```typescript
// Rate limiting per tenant
const tenantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const tenant = req.tenantContext?.tenant;
    // Different limits based on tenant plan
    switch (tenant?.plan_type) {
      case 'enterprise': return 10000;
      case 'premium': return 5000;
      case 'basic': return 1000;
      default: return 100;
    }
  },
  keyGenerator: (req) => {
    return `${req.tenantContext?.tenant?.id}:${req.ip}`;
  },
});

// Input validation with tenant context
const validateTenantData = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      context: { tenant: req.tenantContext?.tenant }
    });
    
    if (error) {
      return res.status(400).json({ error: error.details });
    }
    
    req.validatedData = value;
    next();
  };
};
```

## Migration Strategy

### Phase-by-Phase Migration Plan

#### Phase 1: Infrastructure Preparation (Weeks 1-2)

```bash
# 1. Set up development environment
mkdir smartseller-v2
cd smartseller-v2

# 2. Initialize multi-tenant structure
npx create-react-app frontend --template typescript
mkdir backend
cd backend
npm init -y
npm install express typescript prisma

# 3. Set up database infrastructure
# Create platform database
# Create tenant database template
# Set up connection pooling
```

```typescript
// migration/phase1-setup.ts
const migrationTasks = [
  'Create new project structure',
  'Set up platform database',
  'Create tenant database template',
  'Implement basic tenant context',
  'Set up API gateway structure',
  'Create authentication service',
];
```

#### Phase 2: Core Multi-Tenant Features (Weeks 3-6)

```typescript
// migration/phase2-core.ts
const coreFeatures = [
  'Tenant management system',
  'Dynamic theming engine',
  'Multi-tenant routing',
  'Database isolation layer',
  'Authentication & authorization',
  'Basic admin dashboard',
];

// Migration script for existing data
const migrateExistingData = async () => {
  // 1. Create Rexus tenant in platform database
  const rexusTenant = await createTenant({
    slug: 'rexus',
    name: 'Rexus Gaming',
    domain: 'rexus.smartseller.com',
  });

  // 2. Create Rexus-specific database
  await createTenantDatabase(rexusTenant.id, 'rexus');

  // 3. Migrate existing data to tenant database
  await migrateProducts(existingProducts, rexusTenant.id);
  await migrateCustomers(existingCustomers, rexusTenant.id);
  await migrateOrders(existingOrders, rexusTenant.id);
};
```

#### Phase 3: Advanced Features (Weeks 7-10)

```typescript
// migration/phase3-advanced.ts
const advancedFeatures = [
  'Platform analytics dashboard',
  'Tenant billing system',
  'Custom domain support',
  'Advanced theming options',
  'Marketplace integrations',
  'Performance optimizations',
];
```

#### Phase 4: Testing & Deployment (Weeks 11-12)

```typescript
// migration/phase4-deployment.ts
const deploymentTasks = [
  'Comprehensive testing',
  'Performance testing',
  'Security audit',
  'Documentation completion',
  'Training materials',
  'Production deployment',
];
```

### Data Migration Scripts

```typescript
// migration/data-migration.ts
class DataMigrationService {
  async migrateToMultiTenant(): Promise<void> {
    console.log('Starting multi-tenant migration...');

    // Step 1: Create platform infrastructure
    await this.createPlatformDatabase();

    // Step 2: Create Rexus tenant
    const rexusTenant = await this.createRexusTenant();

    // Step 3: Migrate existing data
    await this.migrateExistingData(rexusTenant);

    // Step 4: Update application configuration
    await this.updateAppConfiguration();

    console.log('Migration completed successfully!');
  }

  private async createRexusTenant(): Promise<Tenant> {
    return await db.tenants.create({
      data: {
        slug: 'rexus',
        name: 'Rexus Gaming',
        domain: 'rexus.com',
        database_name: 'smartseller_rexus',
        theme_config: {
          primary: '#3b82f6',
          secondary: '#64748b',
          logo: '/assets/rexus-logo.png',
          favicon: '/assets/rexus-favicon.ico',
        },
        feature_flags: {
          loyalty_program: true,
          affiliate_program: true,
          warranty_management: true,
          gaming_features: true,
        },
      },
    });
  }

  private async migrateExistingData(tenant: Tenant): Promise<void> {
    const tenantDb = await this.getTenantDatabase(tenant.id);

    // Migrate products
    const products = await this.getExistingProducts();
    for (const product of products) {
      await tenantDb.products.create({
        data: { ...product, tenant_id: tenant.id },
      });
    }

    // Migrate customers
    const customers = await this.getExistingCustomers();
    for (const customer of customers) {
      await tenantDb.customers.create({
        data: { ...customer, tenant_id: tenant.id },
      });
    }

    // Migrate orders
    const orders = await this.getExistingOrders();
    for (const order of orders) {
      await tenantDb.orders.create({
        data: { ...order, tenant_id: tenant.id },
      });
    }
  }
}
```

## Implementation Phases

### Development Timeline

```
Phase 1: Foundation (4 weeks)
├── Week 1: Project Setup & Infrastructure
│   ├── New project structure
│   ├── Database design
│   └── Basic tenant context
├── Week 2: Authentication & Security
│   ├── Multi-tenant auth system
│   ├── API gateway setup
│   └── Security middleware
├── Week 3: Core Backend Services
│   ├── Tenant management API
│   ├── Product service
│   └── Order service
└── Week 4: Frontend Foundation
    ├── Multi-tenant routing
    ├── Dynamic theming
    └── Basic admin dashboard

Phase 2: Feature Implementation (6 weeks)
├── Week 5-6: Tenant Admin Dashboard
│   ├── Product management
│   ├── Order management
│   └── Customer management
├── Week 7-8: Storefront Implementation
│   ├── Dynamic product catalog
│   ├── Shopping cart
│   └── Checkout process
└── Week 9-10: Platform Management
    ├── Tenant creation/management
    ├── Platform analytics
    └── Billing system

Phase 3: Advanced Features (4 weeks)
├── Week 11-12: Customization Features
│   ├── Advanced theming
│   ├── Custom domains
│   └── White-label options
└── Week 13-14: Performance & Polish
    ├── Performance optimization
    ├── Testing & bug fixes
    └── Documentation

Phase 4: Deployment (2 weeks)
├── Week 15: Testing & Security Audit
└── Week 16: Production Deployment
```

### Resource Requirements

```typescript
// Resource estimation
const resourceRequirements = {
  development: {
    frontend_developers: 2,
    backend_developers: 2,
    devops_engineer: 1,
    ui_ux_designer: 1,
    project_manager: 1,
  },
  infrastructure: {
    database_servers: 3, // Platform + 2 tenant DBs initially
    application_servers: 2,
    load_balancer: 1,
    cdn_service: 1,
    monitoring_tools: 1,
  },
  timeline: {
    total_weeks: 16,
    development_weeks: 14,
    testing_weeks: 2,
    estimated_effort: '16 person-weeks',
  },
};
```

## Performance and Scaling

### Performance Optimization Strategies

#### 1. **Database Performance**

```typescript
// Database optimization for multi-tenant
class DatabaseOptimizer {
  async optimizeTenantQueries(): Promise<void> {
    // Connection pooling per tenant
    const tenantPools = new Map<string, ConnectionPool>();

    // Query optimization
    await this.createIndexes([
      'CREATE INDEX idx_products_tenant_category ON products(tenant_id, category_id)',
      'CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status)',
      'CREATE INDEX idx_customers_tenant_email ON customers(tenant_id, email)',
    ]);

    // Database partitioning for large datasets
    await this.setupPartitioning();
  }

  private async setupPartitioning(): Promise<void> {
    // Partition large tables by tenant_id
    await this.executeQuery(`
      CREATE TABLE orders_partitioned (
        LIKE orders INCLUDING ALL
      ) PARTITION BY HASH (tenant_id);
    `);
  }
}
```

#### 2. **Caching Strategy**

```typescript
// Multi-tenant caching
class TenantCacheManager {
  private cache: Map<string, any> = new Map();

  async get(tenantId: string, key: string): Promise<any> {
    const cacheKey = `tenant:${tenantId}:${key}`;
    return await redis.get(cacheKey);
  }

  async set(tenantId: string, key: string, value: any, ttl: number = 300): Promise<void> {
    const cacheKey = `tenant:${tenantId}:${key}`;
    await redis.setex(cacheKey, ttl, JSON.stringify(value));
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    const pattern = `tenant:${tenantId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }
}
```

#### 3. **Frontend Performance**

```typescript
// Code splitting by tenant and features
const TenantAdminDashboard = lazy(() => 
  import('./tenant/admin/pages/Dashboard').then(module => ({
    default: module.Dashboard
  }))
);

// Tenant-specific bundle optimization
const useTenantAssets = (tenantId: string) => {
  const [assets, setAssets] = useState<TenantAssets>();

  useEffect(() => {
    const loadTenantAssets = async () => {
      // Load tenant-specific CSS and assets
      const theme = await import(`./themes/${tenantId}.css`);
      const assets = await import(`./assets/${tenantId}/index.ts`);
      
      setAssets({
        theme: theme.default,
        logo: assets.logo,
        favicon: assets.favicon,
      });
    };

    loadTenantAssets();
  }, [tenantId]);

  return assets;
};
```

### Scaling Considerations

```typescript
// Auto-scaling configuration
const scalingConfig = {
  database: {
    read_replicas: 'auto-scale based on load',
    connection_pooling: 'per-tenant pools',
    query_optimization: 'tenant-aware indexes',
  },
  application: {
    horizontal_scaling: 'kubernetes pods',
    load_balancing: 'round-robin with tenant affinity',
    caching: 'redis cluster with tenant partitioning',
  },
  storage: {
    file_storage: 'tenant-isolated S3 buckets',
    cdn: 'tenant-aware CDN distribution',
    backups: 'per-tenant backup schedules',
  },
};
```

---

This comprehensive restructure plan provides a clear roadmap for transforming SmartSeller into a scalable multi-tenant B2B SaaS platform while maintaining the existing functionality for current users like Rexus Gaming.