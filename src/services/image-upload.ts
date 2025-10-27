import { SecureTokenManager } from '../lib/security/secure-token-manager';
import { DEFAULT_API_CONFIG } from '../config/api';

export interface ImageUploadResult {
  image_url: string;
  image_id: string;
  file_size: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface ImageUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ImageUploadError {
  code: string;
  message: string;
  details?: any;
}

export class ImageUploadService {
  private static instance: ImageUploadService;
  
  static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  /**
   * Validates an image file before upload
   */
  validateImageFile(file: File): string | null {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload only JPEG, PNG, GIF, or WebP images';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }

    if (file.size === 0) {
      return 'File appears to be empty';
    }

    return null;
  }

  /**
   * Uploads a single product image with progress tracking
   */
  async uploadProductImage(
    file: File,
    onProgress?: (progress: ImageUploadProgress) => void
  ): Promise<ImageUploadResult> {
    // Validate file first
    const validationError = this.validateImageFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const formData = new FormData();
    formData.append('file', file);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          });
        }
      });
      
      // Handle successful upload
      xhr.addEventListener('load', () => {
        try {
          if (xhr.status === 201) {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.data) {
              resolve(response.data);
            } else {
              reject(new Error(response.message || 'Upload failed'));
            }
          } else if (xhr.status === 413) {
            reject(new Error('File too large. Maximum size is 5MB.'));
          } else if (xhr.status === 415) {
            reject(new Error('Unsupported file type. Please use JPEG, PNG, GIF, or WebP.'));
          } else if (xhr.status === 401) {
            reject(new Error('Authentication required. Please log in again.'));
          } else {
            const errorResponse = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            reject(new Error(errorResponse.message || `Upload failed: ${xhr.statusText}`));
          }
        } catch (parseError) {
          reject(new Error('Invalid response from server'));
        }
      });
      
      // Handle network errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred during upload'));
      });

      // Handle timeout
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out. Please try again.'));
      });
      
      // Configure request
      xhr.open('POST', `${DEFAULT_API_CONFIG.baseURL}/uploads/product-images`);
      xhr.timeout = 60000; // 60 second timeout
      
      // Add authentication headers
      const authHeaders = SecureTokenManager.getAuthHeaders();
      Object.entries(authHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.send(formData);
    });
  }

  /**
   * Uploads multiple images sequentially with progress tracking
   */
  async uploadMultipleImages(
    files: File[],
    onProgress?: (fileIndex: number, progress: ImageUploadProgress) => void,
    onFileComplete?: (fileIndex: number, result: ImageUploadResult) => void,
    onFileError?: (fileIndex: number, error: Error) => void
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];
    const errors: { index: number; error: Error }[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadProductImage(
          files[i],
          (progress) => onProgress?.(i, progress)
        );
        results.push(result);
        onFileComplete?.(i, result);
      } catch (error) {
        const uploadError = error as Error;
        errors.push({ index: i, error: uploadError });
        onFileError?.(i, uploadError);
      }
    }
    
    // If all uploads failed, throw an error
    if (errors.length === files.length) {
      throw new Error(`All ${files.length} uploads failed`);
    }
    
    // If some uploads failed, log warnings but return successful results
    if (errors.length > 0) {
      console.warn(`${errors.length} out of ${files.length} uploads failed:`, errors);
    }
    
    return results;
  }

  /**
   * Uploads a single image with retry logic
   */
  async uploadWithRetry(
    file: File,
    maxRetries: number = 3,
    onProgress?: (progress: ImageUploadProgress) => void
  ): Promise<ImageUploadResult> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadProductImage(file, onProgress);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry for validation errors or client errors (4xx)
        if (lastError.message.includes('Please upload only') || 
            lastError.message.includes('size must be less than') ||
            lastError.message.includes('Unsupported file type') ||
            lastError.message.includes('Authentication required')) {
          throw lastError;
        }
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`Upload attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Creates a preview URL for a file before upload
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revokes a preview URL to free memory
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Checks if the browser supports the File API
   */
  isFileApiSupported(): boolean {
    return !!(window.File && window.FileReader && window.FileList && window.Blob);
  }

  /**
   * Gets human-readable file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const imageUploadService = ImageUploadService.getInstance();