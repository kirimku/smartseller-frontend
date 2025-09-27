# Single Deployment Multi-Domain Architecture

## 🌐 **How DNS-Based Domain Routing Works**

### **DNS → Server → Application Flow**

```
🌍 User Request Flow:
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │    │     DNS      │    │  Your Server    │    │  SmartSeller    │
│                 │    │   Resolver   │    │  (One Instance) │    │  Application    │
└─────────────────┘    └──────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                   │                       │
         │  smartseller.com      │                   │                       │
         ├──────────────────────►│                   │                       │
         │                       │  YOUR_SERVER_IP   │                       │
         │                       ├──────────────────►│                       │
         │                       │                   │                       │
         │                       │                   │  Host: smartseller.com│
         │                       │                   ├──────────────────────►│
         │                       │                   │                       │
         │                       │                   │  Platform Interface   │
         │                       │                   │◄──────────────────────┤
         │                       │                   │                       │
         │  app.rexus.com        │                   │                       │
         ├──────────────────────►│                   │                       │
         │                       │  YOUR_SERVER_IP   │                       │
         │                       ├──────────────────►│                       │
         │                       │                   │                       │
         │                       │                   │  Host: app.rexus.com  │
         │                       │                   ├──────────────────────►│
         │                       │                   │                       │
         │                       │                   │  Rexus Storefront     │
         │                       │                   │◄──────────────────────┤
```

### **Key Concept: Same Server, Different Response**
Both `smartseller.com` and `app.rexus.com` point to the **SAME server IP**, but the application detects the domain in the HTTP `Host` header and serves different content.

---

## 🏗️ **Single Deployment Architecture**

### **How It Works**

#### **1. DNS Configuration (Same IP for Both Domains)**
```bash
# DNS Records (both point to same server)
smartseller.com    A    123.456.789.100
app.rexus.com      A    123.456.789.100
```

#### **2. Single Application with Domain Detection**
```typescript
// src/utils/domain-detector.ts
export function detectAppMode(): 'platform' | 'tenant' {
  const hostname = window.location.hostname;
  
  if (hostname === 'smartseller.com' || hostname === 'www.smartseller.com') {
    return 'platform';
  } else if (hostname === 'app.rexus.com' || hostname.includes('rexus')) {
    return 'tenant';
  }
  
  // Default for localhost development
  return 'tenant';
}

export function detectTenantSlug(): string {
  const hostname = window.location.hostname;
  
  if (hostname.includes('rexus')) {
    return 'rexus-gaming';
  }
  
  // Could support subdomain-based tenants: {tenant}.smartseller.com
  const subdomain = hostname.split('.')[0];
  if (subdomain && subdomain !== 'www' && subdomain !== 'smartseller') {
    return subdomain;
  }
  
  return 'rexus-gaming'; // default
}
```

#### **3. Dynamic App.tsx (One App, Two Modes)**
```typescript
// src/App.tsx - Single app with domain-based routing
import { useEffect, useState } from 'react';
import { detectAppMode, detectTenantSlug } from './utils/domain-detector';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'platform' | 'tenant' | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string>('');
  
  useEffect(() => {
    const mode = detectAppMode();
    const slug = detectTenantSlug();
    
    setAppMode(mode);
    setTenantSlug(slug);
    
    // Optional: Update document title based on domain
    if (mode === 'platform') {
      document.title = 'SmartSeller Platform';
    } else {
      document.title = 'Rexus Gaming Store';
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
            <TenantApp tenantSlug={tenantSlug} />
          )}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Platform-only component tree
const PlatformApp: React.FC = () => (
  <Routes>
    <Route path="/" element={<PlatformLanding />} />
    <Route path="/platform/*" element={<PlatformRoutes />} />
    <Route path="*" element={<Navigate to="/platform/dashboard" replace />} />
  </Routes>
);

// Tenant-only component tree  
const TenantApp: React.FC<{ tenantSlug: string }> = ({ tenantSlug }) => (
  <TenantProvider tenantSlug={tenantSlug}>
    <Routes>
      <Route path="/" element={<StorefrontHome />} />
      <Route path="/admin/*" element={<TenantAdminRoutes />} />
      <Route path="/products/*" element={<ProductRoutes />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TenantProvider>
);
```

#### **4. Single Nginx Configuration**
```nginx
# /etc/nginx/sites-available/smartseller-multi-domain
server {
    listen 80;
    server_name smartseller.com www.smartseller.com app.rexus.com;
    root /var/www/smartseller/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # PWA assets (for app.rexus.com)
    location = /manifest.webmanifest {
        add_header Content-Type application/manifest+json;
        add_header Cache-Control "public, max-age=86400";
    }

    location = /sw.js {
        add_header Content-Type application/javascript;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API proxy (could be different per domain)
    location /api/ {
        # Route to different backends based on host
        if ($host ~ "smartseller\.com") {
            proxy_pass http://platform-api-backend;
        }
        if ($host ~ "rexus\.com") {
            proxy_pass http://rexus-api-backend;  
        }
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Main SPA route - serves same index.html for all domains
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy - $host\n";
        add_header Content-Type text/plain;
    }
}
```

---

## 📦 **Single Build Deployment**

### **Updated Build Configuration**

#### **Environment Variables (Single .env)**
```bash
# .env.production
VITE_APP_MODE=auto  # Auto-detect based on domain
VITE_PLATFORM_DOMAIN=smartseller.com
VITE_REXUS_DOMAIN=app.rexus.com
VITE_API_BASE_URL=https://api.smartseller.com
VITE_DEFAULT_TENANT=rexus-gaming
```

#### **Updated Vite Config**
```typescript
// vite.config.ts - Single build with domain detection
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    build: {
      outDir: 'dist', // Single output directory
      rollupOptions: {
        input: {
          main: './index.html'
        }
      }
    },
    define: {
      __APP_MODE__: JSON.stringify('auto'), // Auto-detect at runtime
      __PLATFORM_DOMAIN__: JSON.stringify(env.VITE_PLATFORM_DOMAIN),
      __REXUS_DOMAIN__: JSON.stringify(env.VITE_REXUS_DOMAIN),
    },
    plugins: [
      react(),
      VitePWA({
        // PWA config that works for both domains
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.(smartseller|rexus)\.com\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
              },
            },
          ],
        },
        manifest: {
          name: 'SmartSeller Multi-Domain App',
          short_name: 'SmartSeller',
          description: 'Platform and storefront in one app',
          theme_color: '#3b82f6',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            }
          ]
        }
      })
    ],
  };
});
```

#### **Simplified Package.json**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:production": "vite build --mode production",
    "preview": "vite preview",
    "deploy": "./scripts/deploy-single.sh"
  }
}
```

---

## 🚀 **Single Deployment Script**

```bash
#!/bin/bash
# scripts/deploy-single.sh

set -e

echo "🌐 Building Single Multi-Domain Application"
echo "   📊 SmartSeller Platform (smartseller.com)"  
echo "   🎮 Rexus Gaming Store (app.rexus.com)"

# Build once, deploy everywhere
npm run build:production

if [ $? -eq 0 ]; then
    echo "✅ Build successful: $(du -sh dist | cut -f1)"
else
    echo "❌ Build failed"
    exit 1
fi

echo "🚀 Deploying to production server..."

# Single deployment to one server
rsync -avz --delete dist/ user@your-server.com:/var/www/smartseller/

echo "📋 Post-deployment tasks:"
echo "  1. ✅ Single build deployed to /var/www/smartseller/"
echo "  2. ✅ Nginx serves both domains from same location"  
echo "  3. ✅ DNS points both domains to same IP"
echo "  4. ✅ Application auto-detects domain and serves appropriate content"

echo "🎉 Multi-domain deployment complete!"
echo "  📊 Platform: https://smartseller.com"
echo "  🎮 Storefront: https://app.rexus.com"
```

---

## 🔧 **Advantages of Single Deployment**

### **✅ Benefits**
1. **Simplified Infrastructure**: One server, one build, one deployment
2. **Cost Effective**: Single hosting cost, shared resources
3. **Code Sharing**: Same components, utilities, and logic
4. **Unified Updates**: Deploy once, both domains get updates
5. **Easier Monitoring**: Single application to monitor and maintain

### **📊 Resource Efficiency** 
- **Build Size**: ~1.7MB (instead of 3.4MB for two separate builds)
- **Server Resources**: Single instance serving both domains
- **Maintenance**: One codebase, one CI/CD pipeline
- **SSL**: Can use wildcard certificate or individual certs

---

## 🌍 **How Users Experience It**

### **smartseller.com Users:**
1. User types `smartseller.com` in browser
2. DNS resolves to your server IP
3. Nginx serves the same `index.html`
4. JavaScript detects hostname = "smartseller.com"
5. App renders Platform Management interface
6. User sees admin dashboard, tenant management, etc.

### **app.rexus.com Users:**
1. User types `app.rexus.com` in browser  
2. DNS resolves to **same server IP**
3. Nginx serves the **same `index.html`**
4. JavaScript detects hostname = "app.rexus.com" 
5. App renders Rexus Gaming storefront
6. User sees product catalog, gaming theme, shopping cart

### **Behind the Scenes:**
- **Same Server**: Both domains hit identical infrastructure
- **Same Code**: Identical JavaScript bundle serves both experiences  
- **Different UI**: Domain detection triggers different component trees
- **Different APIs**: Can route to different backends per domain
- **Different Themes**: CSS and branding applied based on detected domain

This approach gives you the **best of both worlds**: separate branded experiences for your users, but simplified deployment and maintenance for you! 🎯

Would you like me to implement this single deployment approach?