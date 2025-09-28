// Shared type definitions for multi-tenant architecture

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Standard API Error structure
 */
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details: Record<string, unknown>;
}

// Re-export all types for convenient access
export * from './tenant';
export * from './user';
export * from './product';
export * from './product-management';
export * from './order';