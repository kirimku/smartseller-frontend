/**
 * Product Service
 * 
 * Provides product management functionality including:
 * - Fetching products with filtering and pagination
 * - Creating, updating, and deleting products
 * - Product caching and error handling
 * - Integration with secure authentication
 */

import { 
  getProducts as apiGetProducts, 
  postProducts as apiPostProducts, 
  getProductsById as apiGetProductsById, 
  putProductsById as apiPutProductsById, 
  deleteProductsById as apiDeleteProductsById 
} from '../generated/api/sdk.gen';
import type { 
  CreateProductRequest,
  UpdateProductRequest,
  ProductResponse,
  ProductListItem,
  ProductListResponse,
  GetProductsData,
  ErrorResponse
} from '../generated/api/types.gen';
import { apiClient, getErrorMessage, isApiError } from '../lib/api-client';

export interface ProductFilters {
  page?: number;
  page_size?: number;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'base_price';
  sort_desc?: boolean;
  search?: string;
  category_id?: string;
  brand?: string;
  status?: 'draft' | 'active' | 'inactive' | 'archived';
  min_price?: number;
  max_price?: number;
  low_stock?: boolean;
}

export interface ProductListResult {
  products: ProductListItem[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    has_more_pages: boolean;
  };
}

/**
 * Product Service Class
 */
export class ProductService {
  private static cache = new Map<string, { data: ProductResponse; expiry: Date }>();
  private static listCache = new Map<string, { data: ProductListResult; expiry: Date }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly LIST_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  /**
   * Get products with filtering and pagination
   */
  static async getProducts(filters: ProductFilters = {}): Promise<ProductListResult> {
    const cacheKey = JSON.stringify(filters);
    const cached = this.listCache.get(cacheKey);
    
    if (cached && cached.expiry > new Date()) {
      return cached.data;
    }

    try {
      const queryParams: GetProductsData['query'] = {
        page: filters.page || 1,
        page_size: filters.page_size || 20,
        sort_by: filters.sort_by,
        sort_desc: filters.sort_desc,
        search: filters.search,
        category_id: filters.category_id,
        brand: filters.brand,
        status: filters.status,
        min_price: filters.min_price,
        max_price: filters.max_price,
        low_stock: filters.low_stock,
      };

      const response = await apiGetProducts({
        client: apiClient,
        query: queryParams,
      });

      if (!response.data?.success || !response.data?.data) {
        throw new ProductServiceError(
          response.data?.message || 'Failed to fetch products',
          'FETCH_FAILED',
          response.status
        );
      }

      const result: ProductListResult = {
        products: response.data.data.data,
        pagination: {
          total: response.data.data.meta.total || 0,
          per_page: response.data.data.meta.per_page || 20,
          current_page: response.data.data.meta.current_page || 1,
          last_page: response.data.data.meta.last_page || 1,
          from: response.data.data.meta.from,
          to: response.data.data.meta.to,
          has_more_pages: response.data.data.meta.has_more_pages || false,
        },
      };

      // Cache the result
      this.listCache.set(cacheKey, {
        data: result,
        expiry: new Date(Date.now() + this.LIST_CACHE_DURATION),
      });

      return result;
    } catch (error) {
      if (isApiError(error)) {
        throw new ProductServiceError(
          error.message || 'Failed to fetch products',
          'API_ERROR',
          error.meta?.http_status
        );
      }
      throw new ProductServiceError(
        getErrorMessage(error),
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Get a single product by ID
   */
  static async getProductById(id: string, forceRefresh = false): Promise<ProductResponse> {
    const cached = this.cache.get(id);
    
    if (!forceRefresh && cached && cached.expiry > new Date()) {
      return cached.data;
    }

    try {
      const response = await apiGetProductsById({
        client: apiClient,
        path: { id },
      });

      if (!response.data?.success || !response.data?.data) {
        throw new ProductServiceError(
          response.data?.message || 'Product not found',
          'NOT_FOUND',
          response.status
        );
      }

      const product = response.data.data;

      // Cache the product
      this.cache.set(id, {
        data: product,
        expiry: new Date(Date.now() + this.CACHE_DURATION),
      });

      return product;
    } catch (error) {
      if (isApiError(error)) {
        throw new ProductServiceError(
          error.message || 'Failed to fetch product',
          'API_ERROR',
          error.meta?.http_status
        );
      }
      throw new ProductServiceError(
        getErrorMessage(error),
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Create a new product
   */
  static async createProduct(productData: CreateProductRequest): Promise<ProductResponse> {
    try {
      const response = await apiPostProducts({
        client: apiClient,
        body: productData,
      });

      if (!response.data?.success || !response.data?.data) {
        throw new ProductServiceError(
          response.data?.message || 'Failed to create product',
          'CREATE_FAILED',
          response.status
        );
      }

      const product = response.data.data;

      // Cache the new product
      this.cache.set(product.id, {
        data: product,
        expiry: new Date(Date.now() + this.CACHE_DURATION),
      });

      // Clear list cache to force refresh
      this.clearListCache();

      return product;
    } catch (error) {
      if (isApiError(error)) {
        throw new ProductServiceError(
          error.message || 'Failed to create product',
          'API_ERROR',
          error.meta?.http_status
        );
      }
      throw new ProductServiceError(
        getErrorMessage(error),
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Update an existing product
   */
  static async updateProduct(id: string, productData: UpdateProductRequest): Promise<ProductResponse> {
    try {
      const response = await apiPutProductsById({
        client: apiClient,
        path: { id },
        body: productData,
      });

      if (!response.data?.success || !response.data?.data) {
        throw new ProductServiceError(
          response.data?.message || 'Failed to update product',
          'UPDATE_FAILED',
          response.status
        );
      }

      const product = response.data.data;

      // Update cache
      this.cache.set(id, {
        data: product,
        expiry: new Date(Date.now() + this.CACHE_DURATION),
      });

      // Clear list cache to force refresh
      this.clearListCache();

      return product;
    } catch (error) {
      if (isApiError(error)) {
        throw new ProductServiceError(
          error.message || 'Failed to update product',
          'API_ERROR',
          error.meta?.http_status
        );
      }
      throw new ProductServiceError(
        getErrorMessage(error),
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Delete a product
   */
  static async deleteProduct(id: string): Promise<void> {
    try {
      const response = await apiDeleteProductsById({
        client: apiClient,
        path: { id },
      });

      if (!response.data?.success) {
        throw new ProductServiceError(
          response.data?.message || 'Failed to delete product',
          'DELETE_FAILED',
          response.status
        );
      }

      // Remove from cache
      this.cache.delete(id);

      // Clear list cache to force refresh
      this.clearListCache();
    } catch (error) {
      if (isApiError(error)) {
        throw new ProductServiceError(
          error.message || 'Failed to delete product',
          'API_ERROR',
          error.meta?.http_status
        );
      }
      throw new ProductServiceError(
        getErrorMessage(error),
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Clear all caches
   */
  static clearCache(): void {
    this.cache.clear();
    this.clearListCache();
  }

  /**
   * Clear list cache only
   */
  static clearListCache(): void {
    this.listCache.clear();
  }

  /**
   * Get cached product
   */
  static getCachedProduct(id: string): ProductResponse | null {
    const cached = this.cache.get(id);
    if (cached && cached.expiry > new Date()) {
      return cached.data;
    }
    return null;
  }

  /**
   * Validate product data before submission
   */
  static validateProductData(data: CreateProductRequest | UpdateProductRequest): string[] {
    const errors: string[] = [];

    if ('name' in data && data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Product name is required');
      } else if (data.name.length > 255) {
        errors.push('Product name must be less than 255 characters');
      }
    }

    if ('description' in data && data.description !== undefined) {
      if (!data.description || data.description.trim().length === 0) {
        errors.push('Product description is required');
      }
    }

    if ('price' in data && data.price !== undefined) {
      if (data.price <= 0) {
        errors.push('Product price must be greater than 0');
      }
    }

    if ('category_id' in data && data.category_id !== undefined) {
      if (!data.category_id || data.category_id.trim().length === 0) {
        errors.push('Category is required');
      }
    }

    if ('stock_quantity' in data && data.stock_quantity !== undefined) {
      if (data.stock_quantity < 0) {
        errors.push('Stock quantity cannot be negative');
      }
    }

    if ('weight' in data && data.weight !== undefined) {
      if (data.weight < 0) {
        errors.push('Weight cannot be negative');
      }
    }

    return errors;
  }

  /**
   * Format price for display
   */
  static formatPrice(price: number, currency = 'IDR'): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Get stock status
   */
  static getStockStatus(stockQuantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (stockQuantity === 0) return 'out_of_stock';
    if (stockQuantity <= 10) return 'low_stock';
    return 'in_stock';
  }

  /**
   * Get stock status display text
   */
  static getStockStatusText(stockQuantity: number): string {
    const status = this.getStockStatus(stockQuantity);
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  }
}

/**
 * Product Service Error Class
 */
export class ProductServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

// Export singleton instance and methods
export const productService = ProductService;

export const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  clearCache,
  clearListCache,
  getCachedProduct,
  validateProductData,
  formatPrice,
  getStockStatus,
  getStockStatusText,
} = ProductService;

export default productService;