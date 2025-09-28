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
      // Force service worker update when new version is available
      skipWaiting: true,
      clientsClaim: true,
      // Enable service worker in development mode
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot}'],
        // Exclude index.html from precaching to prevent stale cache issues
        dontCacheBustURLsMatching: /\.\w{8}\./,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          // Cache index.html with NetworkFirst strategy for faster updates
          {
            urlPattern: /^.*\/index\.html$/,
            handler: 'NetworkFirst' as const,
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
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
      ],
      // Add cache control headers for development
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    },
    build: {
      outDir: 'dist', // Single output directory
      // Enable cache-busting with content-based hashing
      rollupOptions: {
        input: {
          main: './index.html'
        },
        output: {
          // Add hash to chunk filenames for cache-busting
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
             // Different naming patterns for different asset types
             if (!assetInfo.name) {
               return `assets/[name]-[hash][extname]`;
             }
             const info = assetInfo.name.split('.');
             const ext = info[info.length - 1];
             if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
               return `assets/images/[name]-[hash][extname]`;
             }
             if (/css/i.test(ext)) {
               return `assets/css/[name]-[hash][extname]`;
             }
             if (/woff2?|eot|ttf|otf/i.test(ext)) {
               return `assets/fonts/[name]-[hash][extname]`;
             }
             return `assets/[name]-[hash][extname]`;
           }
        }
      },
      // Generate source maps for production debugging
      sourcemap: mode === 'production' ? false : true,
      // Optimize chunk splitting for better caching
      chunkSizeWarningLimit: 1000,
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Minify for production
      minify: mode === 'production' ? 'esbuild' : false,
      // Target modern browsers for better optimization
      target: 'esnext'
    },
    define: {
      __APP_MODE__: JSON.stringify('auto'), // Auto-detect at runtime
      __PLATFORM_DOMAIN__: JSON.stringify(env.VITE_PLATFORM_DOMAIN || 'smartseller.com'),
      __REXUS_DOMAIN__: JSON.stringify(env.VITE_REXUS_DOMAIN || 'app.rexus.com'),
      __DEFAULT_TENANT__: JSON.stringify(env.VITE_DEFAULT_TENANT || 'rexus-gaming'),
      __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
      __BUILD_VERSION__: JSON.stringify(`${new Date().getTime()}-${Math.random().toString(36).substr(2, 9)}`),
    },
    plugins: [
      react(),
      VitePWA(getPWAConfig()),
      // Custom plugin to replace placeholders in HTML and JS files
      {
        name: 'build-info-transform',
        transformIndexHtml(html) {
          const buildVersion = `${new Date().getTime()}-${Math.random().toString(36).substr(2, 9)}`;
          const buildTimestamp = new Date().toISOString();
          
          return html
            .replace(/__BUILD_VERSION__/g, buildVersion)
            .replace(/__BUILD_TIMESTAMP__/g, buildTimestamp);
        },
        generateBundle(options, bundle) {
          const buildVersion = `${new Date().getTime()}-${Math.random().toString(36).substr(2, 9)}`;
          const buildTimestamp = new Date().toISOString();
          
          // Transform registerSW.js
           const registerSWBundle = bundle['registerSW.js'];
           if (registerSWBundle && registerSWBundle.type === 'asset') {
             const asset = registerSWBundle as { source: string | Uint8Array };
             if (typeof asset.source === 'string') {
               asset.source = asset.source
                 .replace(/__BUILD_VERSION__/g, buildVersion)
                 .replace(/__BUILD_TIMESTAMP__/g, buildTimestamp);
             }
           }
        }
      }
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
