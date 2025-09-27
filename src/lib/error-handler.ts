import { AxiosError } from 'axios';

// Error types based on the OpenAPI specification
export interface ApiErrorResponse {
  success: boolean;
  message: string;
  error?: string;
  meta?: {
    http_status: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  type: 'api' | 'network' | 'validation' | 'authentication' | 'authorization' | 'unknown';
  message: string;
  statusCode?: number;
  details?: string;
  validationErrors?: ValidationError[];
}

/**
 * Comprehensive error handler for API responses
 * Handles different types of errors from the generated API services
 */
export class ErrorHandler {
  /**
   * Parse and categorize errors from API responses
   */
  static parseError(error: unknown): ApiError {
    // Handle Axios errors (most common for API calls)
    if (error instanceof AxiosError) {
      return this.handleAxiosError(error);
    }

    // Handle generic Error objects
    if (error instanceof Error) {
      return {
        type: 'unknown',
        message: error.message,
        details: error.stack,
      };
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        type: 'unknown',
        message: error,
      };
    }

    // Fallback for unknown error types
    return {
      type: 'unknown',
      message: 'An unexpected error occurred',
      details: JSON.stringify(error),
    };
  }

  /**
   * Handle Axios-specific errors
   */
  private static handleAxiosError(error: AxiosError): ApiError {
    const response = error.response;
    const statusCode = response?.status;

    // Network errors (no response)
    if (!response) {
      return {
        type: 'network',
        message: 'Network error. Please check your internet connection.',
        details: error.message,
      };
    }

    // Parse API error response
    const apiError = response.data as ApiErrorResponse;
    
    // Authentication errors
    if (statusCode === 401) {
      return {
        type: 'authentication',
        message: apiError?.message || 'Authentication failed. Please log in again.',
        statusCode,
        details: apiError?.error,
      };
    }

    // Authorization errors
    if (statusCode === 403) {
      return {
        type: 'authorization',
        message: apiError?.message || 'You do not have permission to perform this action.',
        statusCode,
        details: apiError?.error,
      };
    }

    // Validation errors
    if (statusCode === 400) {
      return {
        type: 'validation',
        message: apiError?.message || 'Invalid request data.',
        statusCode,
        details: apiError?.error,
        validationErrors: this.parseValidationErrors(apiError),
      };
    }

    // Server errors
    if (statusCode && statusCode >= 500) {
      return {
        type: 'api',
        message: apiError?.message || 'Server error. Please try again later.',
        statusCode,
        details: apiError?.error,
      };
    }

    // Other API errors
    return {
      type: 'api',
      message: apiError?.message || 'An error occurred while processing your request.',
      statusCode,
      details: apiError?.error,
    };
  }

  /**
   * Parse validation errors from API response
   */
  private static parseValidationErrors(apiError: ApiErrorResponse): ValidationError[] {
    // This would need to be adapted based on your actual API validation error format
    // For now, return empty array as the OpenAPI spec doesn't specify validation error format
    return [];
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: ApiError): string {
    switch (error.type) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      
      case 'authentication':
        return 'Your session has expired. Please log in again.';
      
      case 'authorization':
        return 'You do not have permission to perform this action.';
      
      case 'validation':
        if (error.validationErrors && error.validationErrors.length > 0) {
          return error.validationErrors.map(ve => ve.message).join(', ');
        }
        return error.message;
      
      case 'api':
        if (error.statusCode === 500) {
          return 'Server error. Please try again later.';
        }
        return error.message;
      
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if error requires user re-authentication
   */
  static requiresReauth(error: ApiError): boolean {
    return error.type === 'authentication' || error.statusCode === 401;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: ApiError): boolean {
    return error.type === 'network' || 
           (error.type === 'api' && error.statusCode && error.statusCode >= 500);
  }

  /**
   * Get error severity level
   */
  static getSeverity(error: ApiError): 'low' | 'medium' | 'high' | 'critical' {
    switch (error.type) {
      case 'network':
        return 'medium';
      
      case 'authentication':
      case 'authorization':
        return 'high';
      
      case 'validation':
        return 'low';
      
      case 'api':
        if (error.statusCode && error.statusCode >= 500) {
          return 'critical';
        }
        return 'medium';
      
      default:
        return 'medium';
    }
  }
}

/**
 * Convenience function to get error message from any error
 */
export function getErrorMessage(error: unknown): string {
  const parsedError = ErrorHandler.parseError(error);
  return ErrorHandler.getUserMessage(parsedError);
}

/**
 * Convenience function to check if error requires re-authentication
 */
export function requiresReauth(error: unknown): boolean {
  const parsedError = ErrorHandler.parseError(error);
  return ErrorHandler.requiresReauth(parsedError);
}

/**
 * Convenience function to check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  const parsedError = ErrorHandler.parseError(error);
  return ErrorHandler.isRetryable(parsedError);
}