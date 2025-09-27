# Dual Domain Deployment Plan

## Overview

Deploy the SmartSeller three-tier architecture across two domains:

- **app.rexus.com** → Rexus Gaming Storefront (Tenant Storefront)
- **smartseller.com** → SmartSeller Platform Management (Platform Admin)

## Architecture Strategy

### Domain Routing Strategy

```
app.rexus.com/
├── /                    → Rexus storefront homepage
├── /products/*         → Rexus product catalog  
├── /login              → Rexus customer authentication
├── /profile            → Rexus customer account
├── /orders             → Rexus customer orders
└── /admin/*            → Rexus store admin dashboard

smartseller.com/
├── /                    → Platform marketing page
├── /platform/login      → Platform admin authentication
├── /platform/dashboard  → Platform admin dashboard
├── /platform/tenants    → Tenant management
└── /platform/analytics  → Platform-wide analytics
```

## Implementation Steps

### Step 1: Environment Configuration

Create separate build configurations for each domain:

#### Environment Variables

```bash
# .env.production.rexus
VITE_APP_MODE=tenant
VITE_TENANT_SLUG=rexus-gaming
VITE_DOMAIN=app.rexus.com
VITE_API_BASE_URL=https://api.rexus.com
VITE_PLATFORM_URL=https://smartseller.com
VITE_TENANT_THEME=rexus-gaming
```

```bash
# .env.production.platform
VITE_APP_MODE=platform
VITE_DOMAIN=smartseller.com
VITE_API_BASE_URL=https://api.smartseller.com
VITE_TENANT_URL=https://app.rexus.com
```

#### Package.json Build Scripts

```json
{
  "scripts": {
    "build:rexus": "vite build --mode production.rexus",
    "build:platform": "vite build --mode production.platform", 
    "build:all": "npm run build:rexus && npm run build:platform",
    "deploy:rexus": "npm run build:rexus && deploy-to-rexus",
    "deploy:platform": "npm run build:platform && deploy-to-platform"
  }
}
```

### Step 2: Vite Configuration Updates

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const isRexusMode = env.VITE_APP_MODE === 'tenant';
  const isPlatformMode = env.VITE_APP_MODE === 'platform';

  return {
    build: {
      outDir: isRexusMode ? 'dist/rexus' : 'dist/platform',
      rollupOptions: {
        input: {
          main: './index.html'
        }
      }
    },
    define: {
      __APP_MODE__: JSON.stringify(env.VITE_APP_MODE),
      __TENANT_SLUG__: JSON.stringify(env.VITE_TENANT_SLUG),
      __DOMAIN__: JSON.stringify(env.VITE_DOMAIN),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@platform': path.resolve(__dirname, './src/platform'),
        '@tenant': path.resolve(__dirname, './src/tenant'),
        '@storefront': path.resolve(__dirname, './src/tenant/storefront'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
      },
    },
  };
});
```

### Step 3: App.tsx Domain-Aware Routing

```typescript
// src/App.tsx - Domain-aware routing
import { useEffect, useState } from 'react';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'platform' | 'tenant' | null>(null);
  
  useEffect(() => {
    // Detect which domain we're on
    const hostname = window.location.hostname;
    const mode = import.meta.env.VITE_APP_MODE;
    
    if (mode === 'platform' || hostname === 'smartseller.com') {
      setAppMode('platform');
    } else if (mode === 'tenant' || hostname.includes('rexus.com')) {
      setAppMode('tenant');
    }
  }, []);

  if (!appMode) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {appMode === 'platform' ? (
            <PlatformApp />
          ) : (
            <TenantApp />
          )}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Platform-only routing
const PlatformApp: React.FC = () => (
  <Routes>
    <Route path="/" element={<PlatformLanding />} />
    <Route path="/platform/login" element={<PlatformLogin />} />
    <Route path="/platform/dashboard" element={<PlatformDashboard />} />
    <Route path="/platform/tenants" element={<TenantManagement />} />
    <Route path="*" element={<Navigate to="/platform/dashboard" replace />} />
  </Routes>
);

// Tenant-only routing (Rexus)
const TenantApp: React.FC = () => (
  <TenantProvider tenantSlug="rexus-gaming">
    <Routes>
      <Route path="/" element={<StorefrontHome />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/admin/*" element={<TenantAdminRoutes />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TenantProvider>
);
```

### Step 4: Tenant Configuration for Rexus

```typescript
// src/config/tenants/rexus-gaming.ts
export const REXUS_TENANT_CONFIG: TenantConfig = {
  id: 'rexus-001',
  slug: 'rexus-gaming', 
  name: 'Rexus Gaming',
  storeName: 'Rexus Gaming Store',
  description: 'Premium Gaming Peripherals & Accessories',
  domain: 'app.rexus.com',
  subdomain: 'app',
  status: 'active',
  planType: 'enterprise',
  contactEmail: 'support@rexus.com',
  settings: {
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    language: 'id-ID',
    taxRate: 11,
    shippingRates: [
      { id: '1', name: 'Standard', rate: 15000, estimatedDays: '3-5' },
      { id: '2', name: 'Express', rate: 25000, estimatedDays: '1-2' },
    ]
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

export const REXUS_THEME: TenantTheme = {
  id: 'rexus-theme-001',
  tenantId: 'rexus-001',
  colors: {
    primary: '#ff6b35',      // Rexus orange
    secondary: '#1a1a1a',    // Dark gray
    accent: '#00d4ff',       // Gaming blue
    background: '#ffffff',
    text: '#1a1a1a',
    border: '#e5e5e5',
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  logoUrl: '/assets/rexus/Rexus_Logo.png',
  faviconUrl: '/assets/rexus/favicon.ico',
  layoutStyle: 'modern',
  customCss: `
    .hero-gradient {
      background: linear-gradient(135deg, #ff6b35 0%, #1a1a1a 100%);
    }
    .gaming-glow {
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
    }
  `
};
```

### Step 5: Deployment Configuration

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/smartseller-platform
server {
    listen 80;
    server_name smartseller.com www.smartseller.com;
    root /var/www/smartseller-platform/dist;
    index index.html;
    
    # Platform routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass https://api.smartseller.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# /etc/nginx/sites-available/rexus-storefront  
server {
    listen 80;
    server_name app.rexus.com;
    root /var/www/rexus-storefront/dist;
    index index.html;
    
    # Storefront routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass https://api.rexus.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Docker Compose (Alternative)

```yaml
# docker-compose.yml
version: '3.8'

services:
  smartseller-platform:
    build:
      context: .
      dockerfile: Dockerfile.platform
    ports:
      - "80:80"
    environment:
      - VITE_APP_MODE=platform
      - VITE_DOMAIN=smartseller.com
    volumes:
      - ./dist/platform:/usr/share/nginx/html

  rexus-storefront:
    build:
      context: .
      dockerfile: Dockerfile.tenant
    ports:
      - "81:80" 
    environment:
      - VITE_APP_MODE=tenant
      - VITE_TENANT_SLUG=rexus-gaming
      - VITE_DOMAIN=app.rexus.com
    volumes:
      - ./dist/rexus:/usr/share/nginx/html
```

### Step 6: CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build Platform
        run: npm run build:platform
        
      - name: Build Rexus
        run: npm run build:rexus
        
      - name: Deploy to SmartSeller.com
        run: |
          rsync -avz --delete dist/platform/ user@smartseller.com:/var/www/platform/
          
      - name: Deploy to app.rexus.com
        run: |
          rsync -avz --delete dist/rexus/ user@app.rexus.com:/var/www/rexus/
```

## Benefits of This Approach

### 🎯 **Clear Separation**
- **smartseller.com**: Pure platform management, no tenant confusion
- **app.rexus.com**: Dedicated Rexus experience with full branding

### 🚀 **Scalability** 
- Easy to add more tenant domains (e.g., `store.techub.com`)
- Platform remains independent and focused
- Each tenant gets optimal performance

### 🔧 **Maintenance**
- Independent deployments per domain
- Domain-specific optimizations
- Separate analytics and monitoring

### 💼 **Business Value**
- Professional platform presence on smartseller.com
- Rexus gets their own branded domain
- Easy customer onboarding flow

## Testing Strategy

### Local Development
```bash
# Test platform mode
VITE_APP_MODE=platform npm run dev

# Test tenant mode  
VITE_APP_MODE=tenant VITE_TENANT_SLUG=rexus-gaming npm run dev
```

### Staging Environment
- **staging.smartseller.com** → Platform testing
- **staging.rexus.com** → Rexus storefront testing

### Production Verification
- Verify routing works correctly on both domains
- Test authentication flows across domains
- Confirm tenant isolation
- Validate theme application

This dual-domain strategy gives you the best of both worlds: a professional platform presence and a fully branded tenant experience!