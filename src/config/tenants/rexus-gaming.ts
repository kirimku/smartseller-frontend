import { TenantConfig, TenantTheme, FeatureFlags, TenantBusinessInfo, TenantSettings } from '../../shared/types/tenant';

export const REXUS_BUSINESS_INFO: TenantBusinessInfo = {
  businessName: 'Rexus Gaming Indonesia',
  businessType: 'retail',
  description: 'Premium Gaming Peripherals & Accessories - Level up your gaming experience with our cutting-edge gaming hardware.',
  email: 'support@rexus.com',
  phone: '+62-21-123-4567',
  website: 'https://app.rexus.com',
  address: {
    street: 'Jl. Gaming Center No. 123',
    city: 'Jakarta',
    state: 'DKI Jakarta',
    postalCode: '12345',
    country: 'Indonesia',
  },
  taxId: 'TAX-REXUS-001',
  businessRegistrationNumber: 'REG-REXUS-2024',
  socialMedia: {
    facebook: 'https://facebook.com/RexusGaming',
    twitter: 'https://twitter.com/RexusGaming',
    instagram: 'https://instagram.com/rexusgaming',
    youtube: 'https://youtube.com/RexusGamingIndonesia',
  }
};

export const REXUS_SETTINGS: TenantSettings = {
  storeName: 'Rexus Gaming Store',
  storeDescription: 'Premium Gaming Peripherals & Accessories',
  storeUrl: 'app.rexus.com',
  timezone: 'Asia/Jakarta',
  currency: 'IDR',
  language: 'id-ID',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  businessHours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '10:00', close: '17:00' },
    sunday: { open: '00:00', close: '00:00', closed: true },
  },
  orderSettings: {
    orderNumberPrefix: 'RX',
    orderNumberLength: 8,
    minimumOrderAmount: 50000,
    allowGuestCheckout: true,
    requirePhoneNumber: true,
    autoConfirmOrders: false,
  },
  shippingSettings: {
    freeShippingThreshold: 500000,
    defaultShippingMethod: 'standard',
    estimatedDeliveryDays: 3,
    allowPickup: true,
    pickupAddress: 'Rexus Gaming Store, Jakarta',
  },
  taxSettings: {
    includeTaxInPrices: true,
    taxRate: 11,
    taxCalculationMethod: 'inclusive',
    showTaxBreakdown: true,
  },
  notifications: {
    orderNotifications: true,
    lowStockAlerts: true,
    customerMessageAlerts: true,
    marketingEmails: true,
  },
  seoSettings: {
    metaTitle: 'Rexus Gaming - Premium Gaming Peripherals',
    metaDescription: 'Level up your gaming with Rexus premium peripherals. Keyboards, mice, headsets and more.',
    metaKeywords: 'gaming, keyboard, mouse, headset, rexus, peripheral',
    ogImage: 'https://app.rexus.com/og-image.jpg',
  }
};

export const REXUS_THEME: TenantTheme = {
  // Brand Colors
  primaryColor: '#ff6b35',      // Rexus signature orange
  secondaryColor: '#1a1a1a',    // Deep dark gray
  accentColor: '#00d4ff',       // Electric gaming blue
  backgroundColor: '#ffffff',   // Clean white background
  surfaceColor: '#f8f9fa',     // Light surface
  errorColor: '#dc2626',
  warningColor: '#f59e0b',
  successColor: '#10b981',
  infoColor: '#3b82f6',
  
  // Text Colors
  textPrimary: '#1a1a1a',
  textSecondary: '#6b7280',
  textDisabled: '#9ca3af',
  textOnPrimary: '#ffffff',
  textOnSecondary: '#ffffff',
  
  // Typography
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  headingFontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Layout
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  
  // Shadows
  boxShadow: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
  
  // Custom CSS
  customCss: `
    /* Rexus Gaming Custom Styles */
    .rexus-hero-gradient {
      background: linear-gradient(135deg, #ff6b35 0%, #1a1a1a 100%);
    }
    
    .rexus-gaming-glow {
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
      transition: all 0.3s ease;
    }
    
    .rexus-gaming-glow:hover {
      box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
    }
    
    .rexus-card {
      background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
      border: 1px solid rgba(255, 107, 53, 0.1);
    }
    
    .rexus-button-primary {
      background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%);
      border: none;
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
    }
    
    .rexus-button-primary:hover {
      background: linear-gradient(135deg, #e55a2b 0%, #ff6b35 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    }
    
    .rexus-accent-text {
      color: #00d4ff;
      font-weight: 600;
    }
    
    .rexus-product-card {
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .rexus-product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border-color: #ff6b35;
    }
  `
};

export const REXUS_FEATURES: FeatureFlags = {
  // Core E-commerce Features
  multiCurrency: true,
  multiLanguage: false,
  inventory: true,
  analytics: true,
  reporting: true,
  
  // Customer Features
  wishlist: true,
  reviews: true,
  ratings: true,
  compareProducts: true,
  recentlyViewed: true,
  
  // Loyalty & Marketing
  loyaltyProgram: true,
  pointsSystem: true,
  referralProgram: true,
  coupons: true,
  flashDeals: true,
  bundleDeals: true,
  
  // Marketing Tools
  emailMarketing: true,
  smsMarketing: false,
  pushNotifications: true,
  socialMediaIntegration: true,
  blogModule: false,
  
  // Advanced Features
  subscriptions: true,
  preOrders: true,
  backorders: false,
  productVariants: true,
  productBundles: true,
  giftCards: true,
  
  // SEO & Performance
  seoTools: true,
  sitemap: true,
  structuredData: true,
  pageSpeed: true,
  imageOptimization: true,
  
  // Integration Features
  api: true,
  webhooks: true,
  thirdPartyIntegrations: true,
  paymentGateways: ['midtrans', 'xendit', 'gopay', 'ovo'],
  shippingProviders: ['jne', 'tiki', 'pos', 'sicepat'],
  marketplaceIntegrations: ['tokopedia', 'shopee', 'bukalapak'],
  
  // Customization
  customDomain: true,
  whiteLabel: false,
  customCheckout: true,
  customEmails: true,
  
  // Support & Communication
  liveChat: true,
  helpDesk: true,
  knowledgeBase: false,
  communityForum: false,
  
  // Security & Compliance
  twoFactorAuth: true,
  sslCertificate: true,
  gdprCompliance: false,
  dataBackup: true,
  auditLogs: true,
};

export const REXUS_TENANT_CONFIG: TenantConfig = {
  id: 'rexus-001',
  slug: 'rexus-gaming', 
  status: 'active',
  plan: 'enterprise',
  planStartDate: '2024-01-01T00:00:00Z',
  billingCycle: 'yearly',
  businessInfo: REXUS_BUSINESS_INFO,
  settings: REXUS_SETTINGS,
  theme: REXUS_THEME,
  features: REXUS_FEATURES,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
};

// Mock product data for Rexus
export const REXUS_MOCK_PRODUCTS = [
  {
    id: 'rx-kb-001',
    name: 'Rexus Legionare MX5',
    category: 'Keyboards',
    price: 899000,
    originalPrice: 1199000,
    discount: 25,
    image: '/src/assets/gaming-keyboard.jpg',
    description: 'Professional mechanical gaming keyboard with RGB backlighting',
    features: ['Mechanical Switches', 'RGB Lighting', 'Anti-Ghosting', 'Programmable Keys'],
    inStock: true,
    rating: 4.8,
    reviews: 324,
  },
  {
    id: 'rx-ms-001',
    name: 'Rexus Xierra G7',
    category: 'Mice',
    price: 459000,
    originalPrice: 599000,
    discount: 23,
    image: '/src/assets/gaming-mouse.jpg',
    description: 'High-precision gaming mouse with 12000 DPI sensor',
    features: ['12000 DPI', 'RGB Lighting', '6 Programmable Buttons', 'Ergonomic Design'],
    inStock: true,
    rating: 4.7,
    reviews: 198,
  },
  {
    id: 'rx-hs-001',
    name: 'Rexus Thundervox HX9',
    category: 'Headsets',
    price: 679000,
    originalPrice: 899000,
    discount: 24,
    image: '/src/assets/gaming-headset.jpg',
    description: '7.1 Surround sound gaming headset with noise cancellation',
    features: ['7.1 Surround Sound', 'Noise Cancelling Mic', 'RGB Lighting', 'Ultra Comfort'],
    inStock: true,
    rating: 4.9,
    reviews: 456,
  },
];

// Export all configs as a single tenant configuration
export const REXUS_TENANT = {
  config: REXUS_TENANT_CONFIG,
  mockData: {
    products: REXUS_MOCK_PRODUCTS,
  }
};

export default REXUS_TENANT;