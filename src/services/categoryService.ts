import { getApiV1Categories } from '../generated/api';
import type { GetApiV1CategoriesData } from '../generated/api';
import { getSecureClient } from '../lib/secure-api-integration';

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parent_id?: string;
  is_active: boolean;
  product_count: number;
  children_count: number;
}

export interface CategoryListResponse {
  success: boolean;
  message: string;
  data: Category[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

// Interface for the actual API response structure
interface ApiCategoryResponse {
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  summary: {
    total_categories: number;
    active_categories: number;
    root_categories: number;
    max_depth_level: number;
  };
}

export class CategoryService {
  /**
   * Fetch categories with optional filtering
   */
  static async getCategories(params?: GetApiV1CategoriesData['query']): Promise<CategoryListResponse> {
    try {
      const response = await getApiV1Categories({
        client: getSecureClient(),
        query: params,
      });

      if (response.error) {
        // Handle authentication errors specifically
        if (response.error.message?.includes('Authorization header is required') || 
            response.error.message?.includes('Unauthorized')) {
          throw new Error('Authentication required. Please log in to access categories.');
        }
        throw new Error(response.error.message || 'Failed to fetch categories');
      }

      // Handle the actual API response structure
      const apiResponse = response.data as ApiCategoryResponse;
      
      // Transform the API response to match our expected interface
      return {
        success: true,
        message: 'Categories fetched successfully',
        data: apiResponse.categories || [],
        meta: {
          current_page: apiResponse.pagination?.page || 1,
          per_page: apiResponse.pagination?.limit || 10,
          total: apiResponse.pagination?.total || 0,
          total_pages: apiResponse.pagination?.total_pages || 1,
          has_next_page: apiResponse.pagination?.has_next || false,
          has_prev_page: apiResponse.pagination?.has_prev || false,
        }
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && 
          (error.message.includes('Authorization header is required') || 
           error.message.includes('Unauthorized'))) {
        throw new Error('Authentication required. Please log in to access categories.');
      }
      
      throw error;
    }
  }

  /**
   * Fetch active categories only
   */
  static async getActiveCategories(): Promise<Category[]> {
    try {
      const response = await this.getCategories({
        is_active: true,
        page_size: 100, // Get a large number to avoid pagination for dropdown
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching active categories:', error);
      throw error;
    }
  }

  /**
   * Fetch categories for dropdown/select components
   */
  static async getCategoriesForDropdown(): Promise<Array<{ value: string; label: string }>> {
    try {
      const categories = await this.getActiveCategories();
      
      return categories.map(category => ({
        value: category.id,
        label: category.name,
      }));
    } catch (error) {
      console.error('Error fetching categories for dropdown:', error);
      return [];
    }
  }
}