/**
 * Domain Detection Utilities for Single Build Multi-Domain Architecture
 * 
 * This module provides functions to detect which application mode and tenant
 * configuration to use based on the current domain/hostname.
 */

export type AppMode = 'platform' | 'tenant';

/**
 * Detects the application mode based on the current hostname
 * @returns 'platform' for SmartSeller admin, 'tenant' for storefronts
 */
export function detectAppMode(): AppMode {
  const hostname = window.location.hostname;
  
  // Platform domains (SmartSeller admin)
  if (hostname === 'smartseller.com' || 
      hostname === 'www.smartseller.com' || 
      hostname === 'smartseller.local' ||
      hostname === 'www.smartseller.local' ||
      hostname.includes('smartseller')) {
    return 'platform';
  }
  
  // Tenant domains (storefronts)
  if (hostname === 'app.rexus.com' || 
      hostname === 'app.rexus.local' ||
      hostname.includes('rexus') ||
      hostname.includes('.app.')) {
    return 'tenant';
  }
  
  // Development environment detection
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check URL path or query params for development routing
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode') || urlParams.get('domain');
    if (modeParam === 'platform') {
      return 'platform';
    }
    
    const path = window.location.pathname;
    if (path.startsWith('/platform')) {
      return 'platform';
    }
    // Default to tenant for development
    return 'tenant';
  }
  
  // Default fallback
  return 'tenant';
}

/**
 * Detects the tenant slug based on the current hostname
 * @returns tenant slug identifier
 */
export function detectTenantSlug(): string {
  const hostname = window.location.hostname;
  
  // Rexus domains
  if (hostname === 'app.rexus.com' || 
      hostname === 'app.rexus.local' ||
      hostname.includes('rexus')) {
    return 'rexus-gaming';
  }
  
  // Subdomain-based tenant detection: {tenant}.smartseller.com
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain && 
        subdomain !== 'www' && 
        subdomain !== 'app' && 
        subdomain !== 'api') {
      return subdomain;
    }
  }
  
  // Custom domain mapping (for enterprise customers)
  const customDomainMap: Record<string, string> = {
    'store.example.com': 'example-store',
    'shop.demo.com': 'demo-tenant',
    // Add more custom domain mappings as needed
  };
  
  if (customDomainMap[hostname]) {
    return customDomainMap[hostname];
  }
  
  // Development environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check for query parameter override
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant');
    if (tenantParam) {
      return tenantParam;
    }
  }
  
  // Default tenant
  return 'rexus-gaming';
}

/**
 * Gets the API base URL based on the detected domain
 * @returns appropriate API endpoint
 */
export function getApiBaseUrl(): string {
  const mode = detectAppMode();
  const hostname = window.location.hostname;
  
  // Production API endpoints
  if (hostname.includes('smartseller.com')) {
    return mode === 'platform' 
      ? 'https://api.smartseller.com/platform'
      : 'https://api.smartseller.com/tenant';
  }
  
  if (hostname.includes('rexus.com')) {
    return 'https://api.rexus.com/v1';
  }
  
  // Development environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return mode === 'platform'
      ? 'http://localhost:3001/platform'
      : 'http://localhost:3001/tenant';
  }
  
  // Default fallback
  return 'https://api.smartseller.com/tenant';
}

/**
 * Gets the appropriate document title based on domain and mode
 * @returns page title string
 */
export function getDocumentTitle(): string {
  const mode = detectAppMode();
  const tenantSlug = detectTenantSlug();
  
  if (mode === 'platform') {
    return 'SmartSeller Platform - Multi-Tenant E-commerce Management';
  }
  
  // Tenant-specific titles
  const tenantTitles: Record<string, string> = {
    'rexus-gaming': 'Rexus Gaming Store - Gaming Gear & Accessories',
    'example-store': 'Example Store - Premium Products',
    'demo-tenant': 'Demo Store - Sample E-commerce',
  };
  
  return tenantTitles[tenantSlug] || `${tenantSlug} Store - E-commerce Platform`;
}

/**
 * Gets environment-specific configuration based on domain
 */
export function getEnvironmentConfig() {
  const mode = detectAppMode();
  const hostname = window.location.hostname;
  
  return {
    mode,
    tenantSlug: detectTenantSlug(),
    apiBaseUrl: getApiBaseUrl(),
    isDevelopment: hostname === 'localhost' || hostname === '127.0.0.1',
    isProduction: hostname !== 'localhost' && hostname !== '127.0.0.1',
    analyticsEnabled: mode === 'platform' || hostname.includes('rexus.com'),
    debugMode: hostname === 'localhost',
  };
}

/**
 * Updates document metadata based on detected domain
 */
export function updateDocumentMetadata(): void {
  const mode = detectAppMode();
  const tenantSlug = detectTenantSlug();
  
  // Update title
  document.title = getDocumentTitle();
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    if (mode === 'platform') {
      metaDescription.setAttribute('content', 'SmartSeller Platform - Manage multiple e-commerce stores from one powerful dashboard');
    } else if (tenantSlug === 'rexus-gaming') {
      metaDescription.setAttribute('content', 'Rexus Gaming Store - Premium gaming gear, peripherals, and accessories for gamers');
    } else {
      metaDescription.setAttribute('content', `${tenantSlug} online store - Quality products and excellent service`);
    }
  }
  
  // Update theme color for PWA
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    const themeColors: Record<string, string> = {
      'platform': '#3b82f6',      // Blue for platform
      'rexus-gaming': '#dc2626',  // Red for Rexus Gaming
    };
    
    const color = mode === 'platform' 
      ? themeColors.platform 
      : themeColors[tenantSlug] || '#3b82f6';
      
    themeColorMeta.setAttribute('content', color);
  }
}

/**
 * Debug helper to log current detection results
 */
export function debugDomainDetection(): void {
  if (process.env.NODE_ENV === 'development') {
    const config = getEnvironmentConfig();
    console.group('🌐 Domain Detection Debug');
    console.log('Hostname:', window.location.hostname);
    console.log('App Mode:', config.mode);
    console.log('Tenant Slug:', config.tenantSlug);
    console.log('API Base URL:', config.apiBaseUrl);
    console.log('Environment:', config.isProduction ? 'Production' : 'Development');
    console.log('Full Config:', config);
    console.groupEnd();
  }
}