import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Single build mode - auto-detect at runtime
  const isAutoMode = env.VITE_APP_MODE === 'auto' || !env.VITE_APP_MODE;
  const isDevelopment = mode === 'development';

  // Unified PWA config that works for both domains
  const getPWAConfig = () => {
    return {
      registerType: 'autoUpdate' as const,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.(smartseller|rexus)\.com\//,
            handler: 'NetworkFirst' as const,
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate' as const,
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'SmartSeller Multi-Domain App',
        short_name: 'SmartSeller',
        description: 'Multi-tenant e-commerce platform - Platform management and storefronts',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone' as const,
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary' as const,
        categories: ['business', 'shopping', 'productivity'],
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ],
        shortcuts: [
          {
            name: 'Platform Dashboard',
            short_name: 'Platform',
            description: 'SmartSeller platform management',
            url: '/platform/dashboard',
            icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }]
          },
          {
            name: 'Rexus Store',
            short_name: 'Rexus',
            description: 'Gaming gear storefront',
            url: '/',
            icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }]
          },
          {
            name: 'Store Admin',
            short_name: 'Admin',
            description: 'Store management',
            url: '/admin/dashboard',
            icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }]
          }
        ]
      }
    };
  };

  return {
    server: {
      host: "::",
      port: 4123,
      // Allow access from local domains for multi-domain testing
      hmr: {
        host: 'localhost'
      },
      // Configure allowed hosts for development
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'smartseller.local',
        'www.smartseller.local',
        'app.rexus.local',
        'www.app.rexus.local',
        '.local' // Allow all .local domains
      ]
    },
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
      __PLATFORM_DOMAIN__: JSON.stringify(env.VITE_PLATFORM_DOMAIN || 'smartseller.com'),
      __REXUS_DOMAIN__: JSON.stringify(env.VITE_REXUS_DOMAIN || 'app.rexus.com'),
      __DEFAULT_TENANT__: JSON.stringify(env.VITE_DEFAULT_TENANT || 'rexus-gaming'),
      __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    },
    plugins: [
      react(),
      VitePWA(getPWAConfig())
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@platform": path.resolve(__dirname, "./src/platform"),
        "@tenant": path.resolve(__dirname, "./src/tenant"),
        "@shared": path.resolve(__dirname, "./src/shared"),
        "@storefront": path.resolve(__dirname, "./src/storefront"),
        "@contexts": path.resolve(__dirname, "./src/contexts"),
      },
    },
  };
});
