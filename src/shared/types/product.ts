/**
 * Product-related type definitions
 */

/**
 * Product category
 */
export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  parent?: ProductCategory;
  children?: ProductCategory[];
  productCount?: number;
}

/**
 * Product variant option (size, color, etc.)
 */
export interface ProductVariantOption {
  id: string;
  name: string;
  value: string;
  sortOrder: number;
}

/**
 * Product variant
 */
export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  
  // Variant attributes
  options: ProductVariantOption[];
  
  // Pricing
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  
  // Inventory
  trackQuantity: boolean;
  quantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  
  // Physical properties
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  
  // Images
  image?: string;
  images?: string[];
  
  // Status
  isActive: boolean;
  isDefault: boolean;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Product image
 */
export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isMain: boolean;
}

/**
 * Product SEO data
 */
export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  slug: string;
  canonicalUrl?: string;
}

/**
 * Product review
 */
export interface ProductReview {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  content?: string;
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  
  // Response from merchant
  response?: {
    content: string;
    respondedBy: string;
    respondedAt: string;
  };
}

/**
 * Main product interface
 */
export interface Product {
  id: string;
  tenantId: string;
  
  // Basic information
  name: string;
  description: string;
  shortDescription?: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  
  // Product identification
  sku: string;
  barcode?: string;
  productType: 'physical' | 'digital' | 'service';
  
  // Categorization
  categoryId?: string;
  category?: ProductCategory;
  tags?: string[];
  vendor?: string;
  brand?: string;
  
  // Pricing
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  
  // Inventory
  trackQuantity: boolean;
  quantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  allowBackorder: boolean;
  
  // Physical properties
  requiresShipping: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  
  // Digital properties (for digital products)
  downloadable: boolean;
  downloadLimit?: number;
  downloadExpiry?: number; // days
  
  // Images and media
  images: ProductImage[];
  videos?: string[];
  
  // Variants
  hasVariants: boolean;
  variants?: ProductVariant[];
  variantOptions?: {
    name: string;
    values: string[];
  }[];
  
  // SEO
  seo: ProductSEO;
  
  // Reviews and ratings
  reviewsEnabled: boolean;
  averageRating?: number;
  reviewCount?: number;
  reviews?: ProductReview[];
  
  // Features and specifications
  features?: {
    name: string;
    value: string;
  }[];
  
  // Related products
  relatedProductIds?: string[];
  crossSellProductIds?: string[];
  upSellProductIds?: string[];
  
  // Metadata
  metafields?: Record<string, unknown>;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  
  // Published date (for scheduled publishing)
  publishedAt?: string;
}

/**
 * Product search filters
 */
export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  status?: Product['status'][];
  tags?: string[];
  brand?: string;
  vendor?: string;
  sortBy?: 'name' | 'price' | 'created' | 'updated' | 'rating' | 'sales';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Product analytics data
 */
export interface ProductAnalytics {
  productId: string;
  views: number;
  uniqueViews: number;
  addToCartCount: number;
  purchaseCount: number;
  conversionRate: number;
  revenue: number;
  averageOrderValue: number;
  returnRate: number;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Product inventory adjustment
 */
export interface InventoryAdjustment {
  id: string;
  productId: string;
  variantId?: string;
  type: 'adjustment' | 'sale' | 'return' | 'damage' | 'theft' | 'restock';
  quantityChange: number; // positive or negative
  quantityAfter: number;
  reason?: string;
  reference?: string; // order ID, adjustment ID, etc.
  adjustedBy: string;
  createdAt: string;
}