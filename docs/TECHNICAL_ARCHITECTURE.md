# SmartSeller Technical Architecture Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Component Structure](#component-structure)
4. [State Management](#state-management)
5. [Routing Architecture](#routing-architecture)
6. [UI/UX Design System](#uiux-design-system)
7. [Data Flow](#data-flow)
8. [Performance Considerations](#performance-considerations)
9. [Security Architecture](#security-architecture)
10. [Build and Deployment](#build-and-deployment)

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SmartSeller Platform                    │
├─────────────────────────────────────────────────────────┤
│  Frontend Layer (React + TypeScript)                      │
│  ├── Admin Dashboard (B2B Management)                     │
│  └── Storefront (Customer Interface)                      │
├─────────────────────────────────────────────────────────┤
│  API Gateway & Backend Services                           │
│  ├── Authentication Service                               │
│  ├── Product Management Service                           │
│  ├── Order Processing Service                             │
│  ├── Customer Management Service                          │
│  ├── Analytics Service                                    │
│  └── Notification Service                                 │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                               │
│  ├── Multi-Tenant Database                                │
│  ├── File Storage (Images, Documents)                     │
│  ├── Cache Layer (Redis)                                  │
│  └── Search Engine (Elasticsearch)                        │
└─────────────────────────────────────────────────────────┘
```

### Application Architecture Pattern

The application follows a **Domain-Driven Design (DDD)** approach with clear separation of concerns:

- **Presentation Layer**: React components and UI logic
- **Application Layer**: Business logic and state management
- **Domain Layer**: Core business entities and rules
- **Infrastructure Layer**: External services and data persistence

## Frontend Architecture

### Technology Stack

```typescript
// Core Technologies
React: "^18.3.1"           // UI framework with hooks and context
TypeScript: "^5.8.3"       // Type-safe JavaScript
Vite: "^5.4.19"           // Build tool and dev server

// UI and Styling
"shadcn/ui": "latest"      // Component library
"tailwindcss": "^3.4.17"  // Utility-first CSS framework
"lucide-react": "^0.462.0" // Icon library

// Routing and State
"react-router-dom": "^6.30.1"  // Client-side routing
"@tanstack/react-query": "^5.83.0"  // Server state management
"zustand": "future"        // Client state management (recommended)

// Development Tools
"eslint": "^9.32.0"       // Code linting
"prettier": "latest"      // Code formatting
```

### Project Structure Analysis

```
src/
├── components/                 # Reusable UI Components
│   ├── common/                # Shared components across domains
│   │   ├── Header.tsx         # Navigation header
│   │   ├── TopBanner.tsx      # Promotional banner
│   │   └── PWAInstallPrompt.tsx # PWA installation prompt
│   ├── sections/              # Page-specific sections
│   │   ├── hero-section.tsx   # Landing page hero
│   │   ├── menu-section.tsx   # Quick action menu
│   │   ├── rewards-section.tsx # Loyalty rewards display
│   │   ├── flash-deals.tsx    # Time-limited offers
│   │   └── featured-products.tsx # Product showcase
│   └── ui/                    # Base UI components (shadcn/ui)
│       ├── button.tsx         # Button component
│       ├── card.tsx           # Card container
│       ├── mobile-nav.tsx     # Mobile navigation
│       └── ...               # Other UI primitives
├── pages/                     # Route components
│   ├── Index.tsx             # Storefront home page
│   ├── AdminLayout.tsx       # Admin dashboard layout
│   ├── AdminDashboard.tsx    # Admin dashboard home
│   ├── ProductDetail.tsx     # Product detail page
│   ├── Profile.tsx           # User profile
│   └── ...                   # Other pages
├── hooks/                     # Custom React hooks
│   ├── use-mobile.tsx        # Mobile detection
│   └── use-toast.ts          # Toast notifications
├── lib/                      # Utility functions
│   └── utils.ts              # Common utilities
├── assets/                   # Static assets
│   ├── banners/              # Promotional images
│   └── ...                   # Other assets
└── types/                    # TypeScript definitions
    └── index.ts              # Shared type definitions
```

## Component Structure

### Component Architecture Patterns

#### 1. **Compound Component Pattern**
Used for complex UI components with multiple related parts:

```typescript
// Example: Mobile Navigation
export const MobileNav = ({ activeTab, onTabChange }: MobileNavProps) => {
  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "rewards", icon: Trophy, label: "Rewards" },
    { id: "shop", icon: ShoppingBag, label: "Shop" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {navItems.map((item) => (
        <NavItem key={item.id} {...item} />
      ))}
    </div>
  );
};
```

#### 2. **Container/Presentational Pattern**
Separation of business logic from presentation:

```typescript
// Container Component (Logic)
const ProductListContainer = () => {
  const { data: products, isLoading } = useProducts();
  const [filters, setFilters] = useState<ProductFilters>({});

  return (
    <ProductList 
      products={products}
      loading={isLoading}
      filters={filters}
      onFiltersChange={setFilters}
    />
  );
};

// Presentational Component (UI)
const ProductList = ({ products, loading, filters, onFiltersChange }) => {
  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

#### 3. **Higher-Order Component (HOC) Pattern**
For cross-cutting concerns like authentication and permissions:

```typescript
// withAuth HOC
const withAuth = <T extends {}>(Component: React.ComponentType<T>) => {
  return (props: T) => {
    const { user, isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
      return <LoginPrompt />;
    }
    
    return <Component {...props} user={user} />;
  };
};

// Usage
const ProtectedPage = withAuth(Dashboard);
```

## State Management

### Multi-Layer State Architecture

```typescript
// 1. Server State (React Query)
const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// 2. Global Client State (Context API)
interface AppState {
  tenant: Tenant;
  theme: Theme;
  user: User | null;
}

const AppStateContext = createContext<AppState>();

// 3. Local Component State (useState/useReducer)
const [activeTab, setActiveTab] = useState("home");
const [searchQuery, setSearchQuery] = useState("");
```

### State Management Patterns

#### 1. **Server State with React Query**
```typescript
// Query for data fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['orders', userId],
  queryFn: () => fetchUserOrders(userId),
  enabled: !!userId,
});

// Mutation for data updates
const mutation = useMutation({
  mutationFn: createOrder,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});
```

#### 2. **Context for Global State**
```typescript
// Multi-tenant context
interface TenantContextType {
  tenant: Tenant;
  updateTenant: (tenant: Tenant) => void;
  theme: Theme;
  updateTheme: (theme: Theme) => void;
}

const TenantContext = createContext<TenantContextType>();

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant>();
  const [theme, setTheme] = useState<Theme>();
  
  return (
    <TenantContext.Provider value={{ tenant, theme, updateTenant: setTenant, updateTheme: setTheme }}>
      {children}
    </TenantContext.Provider>
  );
};
```

## Routing Architecture

### Route Structure

```typescript
// Current routing structure in App.tsx
const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Storefront Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/product/:productId" element={<ProductDetail />} />
      <Route path="/profile" element={<Profile />} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        {/* ... other admin routes */}
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);
```

### Multi-Tenant Routing Strategy

For future multi-tenant architecture:

```typescript
// Proposed multi-tenant routing structure
const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Tenant-specific storefront */}
      <Route path="/:tenantId" element={<TenantWrapper />}>
        <Route index element={<Storefront />} />
        <Route path="products/:productId" element={<ProductDetail />} />
        <Route path="checkout" element={<Checkout />} />
      </Route>
      
      {/* Platform admin */}
      <Route path="/platform" element={<PlatformLayout />}>
        <Route path="tenants" element={<TenantManagement />} />
        <Route path="analytics" element={<PlatformAnalytics />} />
      </Route>
      
      {/* Tenant admin */}
      <Route path="/:tenantId/admin" element={<TenantAdminLayout />}>
        <Route index element={<TenantDashboard />} />
        <Route path="products" element={<ProductManagement />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
```

## UI/UX Design System

### Design Tokens

```typescript
// Theme configuration (tailwind.config.ts)
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          900: '#0f172a',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
};
```

### Component Design Patterns

#### 1. **Responsive Design Pattern**
```typescript
// Mobile-first responsive components
const HeroSection = () => (
  <section className="px-4 sm:px-6 lg:px-8">
    <div className="max-w-sm mx-auto sm:max-w-lg lg:max-w-4xl">
      <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold">
        Welcome to SmartSeller
      </h1>
    </div>
  </section>
);
```

#### 2. **Accessibility Pattern**
```typescript
// Accessible components with ARIA labels
const MobileNav = ({ activeTab, onTabChange }) => (
  <nav aria-label="Main navigation" role="tablist">
    {navItems.map((item) => (
      <button
        key={item.id}
        role="tab"
        aria-selected={activeTab === item.id}
        aria-controls={`panel-${item.id}`}
        onClick={() => onTabChange(item.id)}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{item.label}</span>
      </button>
    ))}
  </nav>
);
```

## Data Flow

### Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Action   │────▶│   Component     │────▶│   Hook/Query    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────▼─────────┐
│   UI Update     │◀────│   State Update  │◀────│   API Call      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Example Data Flow

```typescript
// 1. User clicks "Add to Cart" button
const ProductCard = ({ product }) => {
  const addToCart = useAddToCart();
  
  const handleAddToCart = () => {
    // 2. Component calls hook
    addToCart.mutate({
      productId: product.id,
      quantity: 1,
    });
  };
  
  return (
    <Button onClick={handleAddToCart} disabled={addToCart.isLoading}>
      {addToCart.isLoading ? 'Adding...' : 'Add to Cart'}
    </Button>
  );
};

// 3. Hook makes API call
const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addToCartApi,
    onSuccess: () => {
      // 4. Update cart state
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
```

## Performance Considerations

### Optimization Strategies

#### 1. **Code Splitting**
```typescript
// Route-based code splitting
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));

// Component-based code splitting
const LazyChart = lazy(() => import('./components/Chart'));
```

#### 2. **Memoization**
```typescript
// Component memoization
const ProductCard = memo(({ product, onAddToCart }) => (
  <Card>
    <h3>{product.name}</h3>
    <p>{product.price}</p>
    <Button onClick={() => onAddToCart(product.id)}>
      Add to Cart
    </Button>
  </Card>
));

// Hook memoization
const useFilteredProducts = (products, filters) => {
  return useMemo(() => {
    return products.filter(product => 
      product.category === filters.category
    );
  }, [products, filters]);
};
```

#### 3. **Virtual Scrolling**
```typescript
// For large product lists
const ProductList = ({ products }) => {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
  });
  
  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      {virtualizer.getVirtualItems().map(virtualItem => (
        <ProductCard key={virtualItem.key} product={products[virtualItem.index]} />
      ))}
    </div>
  );
};
```

### Bundle Analysis

Current bundle size analysis:
- **Total Bundle Size**: ~2.1MB (uncompressed)
- **Vendor Chunks**: React, shadcn/ui, React Query
- **App Chunks**: Admin dashboard, Storefront
- **Asset Optimization**: Images, fonts, icons

## Security Architecture

### Frontend Security Measures

#### 1. **Authentication Flow**
```typescript
// JWT token management
const useAuth = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );
  
  const login = async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    const { token } = response.data;
    
    // Store token securely
    localStorage.setItem('auth_token', token);
    setToken(token);
  };
  
  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
  };
  
  return { token, login, logout, isAuthenticated: !!token };
};
```

#### 2. **Route Protection**
```typescript
// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole === 'admin' && !user.isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};
```

#### 3. **Input Validation**
```typescript
// Form validation with Zod
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().max(1000, 'Description too long'),
});

const ProductForm = () => {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

## Build and Deployment

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
```

### Deployment Strategy

1. **Development**: Local development with hot reload
2. **Staging**: Automated deployment on feature branch push
3. **Production**: Manual deployment with approval process

### Environment Configuration

```bash
# .env.local
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=SmartSeller
VITE_TENANT_ID=rexus

# .env.production
VITE_API_URL=https://api.smartseller.com
VITE_APP_NAME=SmartSeller
VITE_CDN_URL=https://cdn.smartseller.com
```

---

This technical architecture document provides a comprehensive overview of the current system and serves as a foundation for future multi-tenant development.