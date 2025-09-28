/**
 * Product Management UI Types
 * 
 * Types specifically for product management components and forms
 */

import type { 
  CreateProductRequest,
  UpdateProductRequest,
  ProductResponse,
  ProductListItem,
  PaginationMeta
} from '../../generated/api/types.gen';

// Re-export API types for convenience
export type { 
  CreateProductRequest,
  UpdateProductRequest,
  ProductResponse,
  ProductListItem,
  PaginationMeta
};

/**
 * Product form data for UI components
 */
export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category_id: string;
  sku?: string;
  stock_quantity?: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  images?: string[];
  is_active?: boolean;
}

/**
 * Product form validation errors
 */
export interface ProductFormErrors {
  name?: string;
  description?: string;
  price?: string;
  category_id?: string;
  sku?: string;
  stock_quantity?: string;
  weight?: string;
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
  };
  images?: string;
  general?: string;
}

/**
 * Product list filters for UI
 */
export interface ProductListFilters {
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

/**
 * Product list state for UI components
 */
export interface ProductListState {
  products: ProductListItem[];
  loading: boolean;
  error: string | null;
  filters: ProductListFilters;
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
 * Product form state for UI components
 */
export interface ProductFormState {
  data: ProductFormData;
  errors: ProductFormErrors;
  loading: boolean;
  submitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

/**
 * Product management action types
 */
export type ProductAction = 
  | 'create'
  | 'edit'
  | 'view'
  | 'delete'
  | 'duplicate'
  | 'activate'
  | 'deactivate'
  | 'archive';

/**
 * Product status with display information
 */
export interface ProductStatusInfo {
  value: 'draft' | 'active' | 'inactive' | 'archived';
  label: string;
  color: 'gray' | 'green' | 'yellow' | 'red';
  description: string;
}

/**
 * Stock status with display information
 */
export interface StockStatusInfo {
  value: 'in_stock' | 'low_stock' | 'out_of_stock';
  label: string;
  color: 'green' | 'yellow' | 'red';
  description: string;
}

/**
 * Product table column configuration
 */
export interface ProductTableColumn {
  key: keyof ProductListItem | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: ProductListItem) => React.ReactNode;
}

/**
 * Product bulk action
 */
export interface ProductBulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: (productIds: string[]) => Promise<void>;
  confirmMessage?: string;
  requiresConfirmation?: boolean;
}

/**
 * Product category option for dropdowns
 */
export interface ProductCategoryOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Product image upload state
 */
export interface ProductImageUpload {
  id: string;
  file?: File;
  url?: string;
  uploading: boolean;
  error?: string;
  progress?: number;
}

/**
 * Product form field configuration
 */
export interface ProductFormField {
  name: keyof ProductFormData;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'file' | 'currency';
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: string | number | boolean) => string | null;
  };
  options?: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
  hidden?: boolean;
}

/**
 * Product search suggestion
 */
export interface ProductSearchSuggestion {
  type: 'product' | 'category' | 'brand';
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
}

/**
 * Product export options
 */
export interface ProductExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  fields: Array<keyof ProductListItem>;
  filters?: ProductListFilters;
  includeImages?: boolean;
  includeVariants?: boolean;
}

/**
 * Product import result
 */
export interface ProductImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
}

/**
 * Product analytics data for dashboard
 */
export interface ProductAnalyticsData {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  averagePrice: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentlyAdded: ProductListItem[];
}

/**
 * Product management permissions
 */
export interface ProductPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canBulkEdit: boolean;
  canExport: boolean;
  canImport: boolean;
  canManageCategories: boolean;
}

/**
 * Product management configuration
 */
export interface ProductManagementConfig {
  pageSize: number;
  maxImageSize: number;
  allowedImageTypes: string[];
  maxImagesPerProduct: number;
  enableBulkActions: boolean;
  enableExport: boolean;
  enableImport: boolean;
  defaultSortBy: ProductListFilters['sort_by'];
  defaultSortDesc: boolean;
  autoSaveDraft: boolean;
  autoSaveInterval: number; // milliseconds
}

/**
 * Product management context value
 */
export interface ProductManagementContextValue {
  state: ProductListState;
  config: ProductManagementConfig;
  permissions: ProductPermissions;
  actions: {
    loadProducts: (filters?: ProductListFilters) => Promise<void>;
    createProduct: (data: ProductFormData) => Promise<ProductResponse>;
    updateProduct: (id: string, data: Partial<ProductFormData>) => Promise<ProductResponse>;
    deleteProduct: (id: string) => Promise<void>;
    bulkDelete: (ids: string[]) => Promise<void>;
    bulkUpdateStatus: (ids: string[], status: ProductStatusInfo['value']) => Promise<void>;
    exportProducts: (options: ProductExportOptions) => Promise<void>;
    importProducts: (file: File) => Promise<ProductImportResult>;
    setFilters: (filters: Partial<ProductListFilters>) => void;
    clearFilters: () => void;
    refreshProducts: () => Promise<void>;
  };
}

/**
 * Utility type for product form validation
 */
export type ProductFormValidator = (data: ProductFormData) => ProductFormErrors;

/**
 * Utility type for product status helpers
 */
export type ProductStatusHelper = {
  getStatusInfo: (status: ProductStatusInfo['value']) => ProductStatusInfo;
  getStockStatusInfo: (stockQuantity: number) => StockStatusInfo;
  canTransitionTo: (from: ProductStatusInfo['value'], to: ProductStatusInfo['value']) => boolean;
  getAvailableActions: (status: ProductStatusInfo['value']) => ProductAction[];
};

/**
 * Product management hook return type
 */
export interface UseProductManagementReturn {
  products: ProductListItem[];
  loading: boolean;
  error: string | null;
  pagination: ProductListState['pagination'];
  filters: ProductListFilters;
  selectedProducts: string[];
  
  // Actions
  loadProducts: (filters?: ProductListFilters) => Promise<void>;
  createProduct: (data: ProductFormData) => Promise<ProductResponse>;
  updateProduct: (id: string, data: Partial<ProductFormData>) => Promise<ProductResponse>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Bulk actions
  selectProduct: (id: string) => void;
  selectAllProducts: () => void;
  clearSelection: () => void;
  bulkDelete: () => Promise<void>;
  bulkUpdateStatus: (status: ProductStatusInfo['value']) => Promise<void>;
  
  // Filters
  setFilters: (filters: Partial<ProductListFilters>) => void;
  clearFilters: () => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: ProductListFilters['sort_by'], desc?: boolean) => void;
  
  // Pagination
  goToPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // Utilities
  refreshProducts: () => Promise<void>;
  getProduct: (id: string) => ProductListItem | undefined;
  isSelected: (id: string) => boolean;
  hasSelection: boolean;
  selectionCount: number;
}