import { z } from 'zod';
import { ProductFormData, ProductListFilters } from '../types/product-management';

/**
 * Validation utilities for product management forms
 */

// Common validation patterns
export const ValidationPatterns = {
  // SKU: alphanumeric with hyphens and underscores, 3-50 characters
  SKU: /^[A-Za-z0-9_-]{3,50}$/,
  
  // Price: positive number with up to 2 decimal places
  PRICE: /^\d+(\.\d{1,2})?$/,
  
  // Weight: positive number with up to 3 decimal places
  WEIGHT: /^\d+(\.\d{1,3})?$/,
  
  // Dimensions: positive number with up to 2 decimal places
  DIMENSIONS: /^\d+(\.\d{1,2})?$/,
  
  // Product name: letters, numbers, spaces, and common punctuation
  PRODUCT_NAME: /^[A-Za-z0-9\s\-_.,()&]+$/,
  
  // Category slug: lowercase letters, numbers, and hyphens
  CATEGORY_SLUG: /^[a-z0-9-]+$/,
} as const;

// Custom validation messages
export const ValidationMessages = {
  REQUIRED: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  MIN_VALUE: (min: number) => `Must be at least ${min}`,
  MAX_VALUE: (max: number) => `Must be no more than ${max}`,
  POSITIVE_NUMBER: 'Must be a positive number',
  INVALID_SKU: 'SKU must be 3-50 characters, alphanumeric with hyphens/underscores only',
  INVALID_PRICE: 'Price must be a positive number with up to 2 decimal places',
  INVALID_WEIGHT: 'Weight must be a positive number with up to 3 decimal places',
  INVALID_DIMENSIONS: 'Dimensions must be positive numbers with up to 2 decimal places',
  INVALID_PRODUCT_NAME: 'Product name contains invalid characters',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_URL: 'Invalid URL format',
  FILE_TOO_LARGE: (maxSize: string) => `File size must be less than ${maxSize}`,
  INVALID_FILE_TYPE: (allowedTypes: string[]) => `File type must be one of: ${allowedTypes.join(', ')}`,
} as const;

// Zod schema for product form validation
export const ProductFormSchema = z.object({
  name: z
    .string()
    .min(1, ValidationMessages.REQUIRED)
    .min(3, ValidationMessages.MIN_LENGTH(3))
    .max(255, ValidationMessages.MAX_LENGTH(255))
    .regex(ValidationPatterns.PRODUCT_NAME, ValidationMessages.INVALID_PRODUCT_NAME),
  
  description: z
    .string()
    .min(1, ValidationMessages.REQUIRED)
    .min(10, ValidationMessages.MIN_LENGTH(10))
    .max(2000, ValidationMessages.MAX_LENGTH(2000)),
  
  price: z
    .number()
    .positive(ValidationMessages.POSITIVE_NUMBER)
    .max(999999.99, ValidationMessages.MAX_VALUE(999999.99))
    .refine(
      (val) => ValidationPatterns.PRICE.test(val.toString()),
      ValidationMessages.INVALID_PRICE
    ),
  
  category_id: z
    .string()
    .min(1, ValidationMessages.REQUIRED),
  
  sku: z
    .string()
    .optional()
    .refine(
      (val) => !val || ValidationPatterns.SKU.test(val),
      ValidationMessages.INVALID_SKU
    ),
  
  stock_quantity: z
    .number()
    .int('Stock quantity must be a whole number')
    .min(0, ValidationMessages.MIN_VALUE(0))
    .max(999999, ValidationMessages.MAX_VALUE(999999))
    .optional(),
  
  weight: z
    .number()
    .positive(ValidationMessages.POSITIVE_NUMBER)
    .max(9999.999, ValidationMessages.MAX_VALUE(9999.999))
    .optional()
    .refine(
      (val) => !val || ValidationPatterns.WEIGHT.test(val.toString()),
      ValidationMessages.INVALID_WEIGHT
    ),
  
  dimensions: z
    .object({
      length: z
        .number()
        .positive(ValidationMessages.POSITIVE_NUMBER)
        .max(9999.99, ValidationMessages.MAX_VALUE(9999.99))
        .optional(),
      width: z
        .number()
        .positive(ValidationMessages.POSITIVE_NUMBER)
        .max(9999.99, ValidationMessages.MAX_VALUE(9999.99))
        .optional(),
      height: z
        .number()
        .positive(ValidationMessages.POSITIVE_NUMBER)
        .max(9999.99, ValidationMessages.MAX_VALUE(9999.99))
        .optional(),
    })
    .optional(),
  
  images: z
    .array(z.string().url(ValidationMessages.INVALID_URL))
    .max(10, 'Maximum 10 images allowed')
    .optional(),
  
  is_active: z.boolean().optional(),
});

// Schema for product list filters
export const ProductListFiltersSchema = z.object({
  search: z.string().max(255, ValidationMessages.MAX_LENGTH(255)).optional(),
  category_id: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  price_min: z
    .number()
    .min(0, ValidationMessages.MIN_VALUE(0))
    .optional(),
  price_max: z
    .number()
    .min(0, ValidationMessages.MIN_VALUE(0))
    .optional(),
  stock_status: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'all']).optional(),
  sort_by: z.enum(['name', 'price', 'created_at', 'stock_quantity']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
}).refine(
  (data) => {
    if (data.price_min && data.price_max) {
      return data.price_min <= data.price_max;
    }
    return true;
  },
  {
    message: 'Minimum price must be less than or equal to maximum price',
    path: ['price_min'],
  }
);

// Validation helper functions
export const ValidationHelpers = {
  /**
   * Validates a single field value
   */
  validateField: <T extends keyof ProductFormData>(
    field: T,
    value: ProductFormData[T],
    schema = ProductFormSchema
  ) => {
    try {
      const fieldSchema = schema.shape[field];
      fieldSchema.parse(value);
      return { isValid: true, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.errors[0]?.message || 'Validation error',
        };
      }
      return { isValid: false, error: 'Unknown validation error' };
    }
  },

  /**
   * Validates the entire product form
   */
  validateProductForm: (data: Partial<ProductFormData>) => {
    try {
      ProductFormSchema.parse(data);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Unknown validation error' } };
    }
  },

  /**
   * Validates product list filters
   */
  validateFilters: (filters: Partial<ProductListFilters>) => {
    try {
      ProductListFiltersSchema.parse(filters);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Unknown validation error' } };
    }
  },

  /**
   * Validates file uploads
   */
  validateFile: (
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      maxFiles?: number;
    } = {}
  ) => {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      maxFiles = 10,
    } = options;

    const errors: string[] = [];

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      errors.push(ValidationMessages.FILE_TOO_LARGE(`${maxSizeMB}MB`));
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(ValidationMessages.INVALID_FILE_TYPE(allowedTypes));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validates multiple files
   */
  validateFiles: (
    files: FileList | File[],
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      maxFiles?: number;
    } = {}
  ) => {
    const { maxFiles = 10 } = options;
    const fileArray = Array.from(files);
    const errors: string[] = [];

    // Check number of files
    if (fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }

    // Validate each file
    const fileErrors: Record<string, string[]> = {};
    fileArray.forEach((file, index) => {
      const validation = ValidationHelpers.validateFile(file, options);
      if (!validation.isValid) {
        fileErrors[`file_${index}`] = validation.errors;
      }
    });

    return {
      isValid: errors.length === 0 && Object.keys(fileErrors).length === 0,
      errors,
      fileErrors,
    };
  },

  /**
   * Sanitizes input values
   */
  sanitizeInput: (value: string, type: 'text' | 'number' | 'email' | 'url' = 'text') => {
    if (!value) return '';

    let sanitized = value.trim();

    switch (type) {
      case 'number': {
        // Remove non-numeric characters except decimal point
        sanitized = sanitized.replace(/[^0-9.]/g, '');
        // Ensure only one decimal point
        const parts = sanitized.split('.');
        if (parts.length > 2) {
          sanitized = parts[0] + '.' + parts.slice(1).join('');
        }
        break;
      }
      case 'email':
        // Convert to lowercase
        sanitized = sanitized.toLowerCase();
        break;
      case 'url':
        // Convert to lowercase and trim trailing slash
        sanitized = sanitized.toLowerCase().replace(/\/$/, '');
        break;
      case 'text':
      default:
        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, ' ');
        break;
    }

    return sanitized;
  },

  /**
   * Debounced validation for real-time form validation
   */
  createDebouncedValidator: <T>(
    validator: (value: T) => { isValid: boolean; error: string | null },
    delay = 300
  ) => {
    let timeoutId: NodeJS.Timeout;

    return (value: T, callback: (result: { isValid: boolean; error: string | null }) => void) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const result = validator(value);
        callback(result);
      }, delay);
    };
  },
};

// Export types for use in components
export type ProductFormValidation = z.infer<typeof ProductFormSchema>;
export type ProductFiltersValidation = z.infer<typeof ProductListFiltersSchema>;
export type ValidationResult = { isValid: boolean; error: string | null };
export type ValidationErrors = Record<string, string>;