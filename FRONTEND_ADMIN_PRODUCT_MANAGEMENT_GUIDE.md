# Frontend Admin Product Management Implementation Guide

## Overview

This guide provides comprehensive documentation for implementing product management functionality in the admin frontend. It covers the three core operations: **Create**, **Get**, and **List** products, along with detailed API specifications, data structures, and implementation flows.

## Table of Contents

1. [Authentication Requirements](#authentication-requirements)
2. [API Endpoints Overview](#api-endpoints-overview)
3. [Data Structures](#data-structures)
4. [Product Creation Flow](#product-creation-flow)
5. [Product Retrieval (Get)](#product-retrieval-get)
6. [Product Listing](#product-listing)
7. [Error Handling](#error-handling)
8. [Implementation Examples](#implementation-examples)
9. [Best Practices](#best-practices)

---

## Authentication Requirements

All product management endpoints require authentication using Bearer token:

```javascript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

**Important Notes:**
- Ensure the user has admin privileges
- Handle token expiration gracefully
- Implement token refresh mechanism

---

## API Endpoints Overview

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Create Product | `POST` | `/api/v1/products` | Create a new product |
| Get Product | `GET` | `/api/v1/products/{id}` | Retrieve a specific product |
| List Products | `GET` | `/api/v1/products` | Get paginated list of products |
| Update Product | `PUT` | `/api/v1/products/{id}` | Update existing product |
| Delete Product | `DELETE` | `/api/v1/products/{id}` | Soft delete a product |

---

## Data Structures

### CreateProductRequest

```typescript
interface CreateProductRequest {
  // Required fields
  name: string;                    // 1-255 characters
  sku: string;                     // 3-100 characters, alphanumeric with underscore/hyphen
  base_price: number;              // Must be > 0
  
  // Optional fields
  description?: string;            // Max 2000 characters
  category_id?: string;            // UUID format
  brand?: string;                  // Max 100 characters
  tags?: string[];                 // Array of strings, max 20 items, each max 50 chars
  sale_price?: number;             // Must be >= 0
  cost_price?: number;             // Must be >= 0
  stock_quantity?: number;         // Default: 0, min: 0
  low_stock_threshold?: number;    // Default: 10, min: 0
  track_inventory?: boolean;       // Default: true
  
  // Physical attributes
  weight?: number;                 // In kg, min: 0
  dimensions_length?: number;      // In cm, min: 0
  dimensions_width?: number;       // In cm, min: 0
  dimensions_height?: number;      // In cm, min: 0
  
  // SEO fields
  meta_title?: string;             // Max 160 characters
  meta_description?: string;       // Max 320 characters
  slug?: string;                   // URL-friendly, lowercase with hyphens
}
```

### ProductImage

```typescript
interface ProductImage {
  id: string;                      // UUID
  image_url: string;               // Full URL to the image (Cloudflare R2)
  is_primary: boolean;             // Whether this is the primary product image
  sort_order: number;              // Display order (0-based)
}
```

### ProductResponse

```typescript
interface ProductResponse {
  id: string;                      // UUID
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  brand?: string;
  tags: string[];
  
  // Pricing
  base_price: number;
  sale_price?: number;
  cost_price?: number;
  effective_price: number;         // Computed field (sale_price || base_price)
  profit_margin?: number;          // Computed field
  
  // Inventory
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold?: number;
  is_low_stock: boolean;           // Computed field
  
  // Status
  status: 'draft' | 'active' | 'inactive' | 'archived';
  
  // Physical attributes
  weight?: number;
  dimensions_length?: number;
  dimensions_width?: number;
  dimensions_height?: number;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  slug?: string;
  
  // Images (included when using include=images parameter)
  images?: ProductImage[];         // Array of product images, sorted by sort_order
  
  // Metadata
  created_by: string;              // UUID
  created_at: string;              // ISO 8601 timestamp
  updated_at: string;              // ISO 8601 timestamp
}
```

### ProductListResponse

```typescript
interface ProductListResponse {
  products: ProductResponse[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  filters_applied: {
    search?: string;
    category_id?: string;
    brand?: string;
    status?: string;
    min_price?: number;
    max_price?: number;
    low_stock?: boolean;
  };
}
```

---

## Product Creation Flow

### Step-by-Step Implementation

#### 1. Form Validation (Frontend)

```typescript
const validateProductForm = (data: CreateProductRequest): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  // Required field validation
  if (!data.name?.trim()) {
    errors.name = 'Product name is required';
  } else if (data.name.length > 255) {
    errors.name = 'Product name must be less than 255 characters';
  }
  
  if (!data.sku?.trim()) {
    errors.sku = 'SKU is required';
  } else if (!/^[A-Z0-9_-]+$/.test(data.sku)) {
    errors.sku = 'SKU must contain only uppercase letters, numbers, underscores, and hyphens';
  }
  
  if (!data.base_price || data.base_price <= 0) {
    errors.base_price = 'Base price must be greater than 0';
  }
  
  // Optional field validation
  if (data.sale_price && data.sale_price < 0) {
    errors.sale_price = 'Sale price cannot be negative';
  }
  
  if (data.sale_price && data.base_price && data.sale_price > data.base_price) {
    errors.sale_price = 'Sale price cannot be higher than base price';
  }
  
  return errors;
};
```

#### 2. API Call Implementation

```typescript
const createProduct = async (productData: CreateProductRequest): Promise<ProductResponse> => {
  try {
    const response = await fetch('/api/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new APIError(result.message, response.status, result.errors);
    }
    
    return result.data;
  } catch (error) {
    console.error('Failed to create product:', error);
    throw error;
  }
};
```

#### 3. Form Component Example (React)

```typescript
const CreateProductForm: React.FC = () => {
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    sku: '',
    base_price: 0,
    track_inventory: true,
    stock_quantity: 0,
    low_stock_threshold: 10,
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateProductForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newProduct = await createProduct(formData);
      
      // Success handling
      showSuccessMessage('Product created successfully!');
      navigateToProductList();
      
    } catch (error) {
      handleAPIError(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields implementation */}
    </form>
  );
};
```

---

## Product Retrieval (Get)

### API Endpoint

```
GET /api/v1/products/{id}?include=category,variants,images
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Product ID |
| `include` | string | No | Comma-separated list of related data to include |

### Include Parameter Options

The `include` parameter allows you to fetch related data along with the product. Supported values:

| Value | Description | Response Field |
|-------|-------------|----------------|
| `images` | Product images with URLs, primary status, and sort order | `images: ProductImage[]` |
| `category` | Product category information | `category: CategoryResponse` |
| `variants` | Product variants and options | `variants: ProductVariant[]` |

**Important Notes:**
- Multiple includes can be combined: `include=images,category,variants`
- Images are stored in Cloudflare R2 and returned as full URLs
- Images are automatically sorted by `sort_order` (ascending)
- Primary image is indicated by `is_primary: true`

### Image Retrieval Details

When using `include=images`, the response will contain an `images` array with the following structure:

```typescript
// Example response with images
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "sku": "PROD-001",
    "name": "Sample Product",
    // ... other product fields
    "images": [
      {
        "id": "img-001",
        "image_url": "https://pub-123.r2.dev/products/image1.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-002", 
        "image_url": "https://pub-123.r2.dev/products/image2.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ]
  }
}
```

### Implementation

```typescript
const getProduct = async (productId: string, include?: string[]): Promise<ProductResponse> => {
  try {
    const params = new URLSearchParams();
    if (include && include.length > 0) {
      params.append('include', include.join(','));
    }
    
    const url = `/api/v1/products/${productId}${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new APIError(result.message, response.status);
    }
    
    return result.data;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    throw error;
  }
};
```

### Image Handling Utilities

```typescript
// Helper function to get primary image
const getPrimaryImage = (product: ProductResponse): ProductImage | null => {
  if (!product.images || product.images.length === 0) {
    return null;
  }
  
  return product.images.find(img => img.is_primary) || product.images[0];
};

// Helper function to get all images sorted by order
const getSortedImages = (product: ProductResponse): ProductImage[] => {
  if (!product.images) {
    return [];
  }
  
  return [...product.images].sort((a, b) => a.sort_order - b.sort_order);
};

// Helper function to check if product has images
const hasImages = (product: ProductResponse): boolean => {
  return !!(product.images && product.images.length > 0);
};
```

### Usage Examples

#### Basic Product Retrieval

```typescript
// Get basic product data (no images)
const product = await getProduct('550e8400-e29b-41d4-a716-446655440000');

// Get product with images only
const productWithImages = await getProduct(
  '550e8400-e29b-41d4-a716-446655440000',
  ['images']
);

// Get product with all related data
const productWithDetails = await getProduct(
  '550e8400-e29b-41d4-a716-446655440000',
  ['category', 'variants', 'images']
);
```

#### Image Display Component (React)

```typescript
import React from 'react';

interface ProductImageGalleryProps {
  product: ProductResponse;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ product }) => {
  const primaryImage = getPrimaryImage(product);
  const allImages = getSortedImages(product);
  
  if (!hasImages(product)) {
    return (
      <div className="no-images-placeholder">
        <img src="/placeholder-image.png" alt="No image available" />
      </div>
    );
  }
  
  return (
    <div className="product-image-gallery">
      {/* Primary Image Display */}
      <div className="primary-image">
        <img 
          src={primaryImage?.image_url} 
          alt={product.name}
          className="main-product-image"
        />
      </div>
      
      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="image-thumbnails">
          {allImages.map((image, index) => (
            <img
              key={image.id}
              src={image.image_url}
              alt={`${product.name} - Image ${index + 1}`}
              className={`thumbnail ${image.is_primary ? 'primary' : ''}`}
              onClick={() => setSelectedImage(image)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

#### Product Card with Image (React)

```typescript
interface ProductCardProps {
  productId: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ productId }) => {
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Always include images for product cards
        const productData = await getProduct(productId, ['images']);
        setProduct(productData);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId]);
  
  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;
  
  const primaryImage = getPrimaryImage(product);
  
  return (
    <div className="product-card">
      <div className="product-image">
        {primaryImage ? (
          <img 
            src={primaryImage.image_url} 
            alt={product.name}
            className="card-image"
          />
        ) : (
          <div className="no-image-placeholder">
            No Image
          </div>
        )}
      </div>
      
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="sku">SKU: {product.sku}</p>
        <p className="price">${product.effective_price}</p>
        
        {hasImages(product) && (
          <span className="image-count">
            {product.images!.length} image{product.images!.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
};
```

#### Error Handling for Images

```typescript
const ProductImageWithFallback: React.FC<{ 
  image: ProductImage; 
  alt: string; 
  className?: string;
}> = ({ image, alt, className }) => {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
    console.warn(`Failed to load image: ${image.image_url}`);
  };
  
  if (imageError) {
    return (
      <div className={`image-error-placeholder ${className}`}>
        <span>Image not available</span>
      </div>
    );
  }
  
  return (
    <img
      src={image.image_url}
      alt={alt}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  );
};
```

---

## Product Listing

### API Endpoint

```
GET /api/v1/products
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-based) |
| `page_size` | number | 20 | Items per page (1-100) |
| `sort_by` | string | 'created_at' | Sort field: name, created_at, updated_at, base_price |
| `sort_desc` | boolean | true | Sort in descending order |
| `search` | string | - | Search in name, description, SKU |
| `category_id` | string (UUID) | - | Filter by category |
| `brand` | string | - | Filter by brand |
| `status` | string | - | Filter by status: draft, active, inactive, archived |
| `min_price` | number | - | Minimum price filter |
| `max_price` | number | - | Maximum price filter |
| `low_stock` | boolean | - | Filter products with low stock |

### Implementation

```typescript
interface ProductListFilters {
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

const listProducts = async (filters: ProductListFilters = {}): Promise<ProductListResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await fetch(`/api/v1/products?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new APIError(result.message, response.status);
    }
    
    return result.data;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
```

### Usage Examples

```typescript
// Get first page with default settings
const products = await listProducts();

// Get products with search and filters
const filteredProducts = await listProducts({
  search: 'wireless headphones',
  category_id: '550e8400-e29b-41d4-a716-446655440001',
  status: 'active',
  min_price: 50,
  max_price: 500,
  page: 1,
  page_size: 20,
  sort_by: 'name',
  sort_desc: false,
});

// Get low stock products
const lowStockProducts = await listProducts({
  low_stock: true,
  sort_by: 'stock_quantity',
  sort_desc: false,
});
```

---

## Error Handling

### Error Response Structure

```typescript
interface APIErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
  error_code?: string;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}
```

### Common Error Scenarios

#### 1. Validation Errors (400)

```typescript
// Example validation error response
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "sku",
      "message": "SKU must be unique",
      "code": "DUPLICATE_SKU"
    },
    {
      "field": "base_price",
      "message": "Base price must be greater than 0",
      "code": "INVALID_PRICE"
    }
  ]
}
```

#### 2. Authentication Errors (401)

```typescript
{
  "success": false,
  "message": "Authentication required",
  "error_code": "UNAUTHORIZED"
}
```

#### 3. Not Found Errors (404)

```typescript
{
  "success": false,
  "message": "Product not found",
  "error_code": "PRODUCT_NOT_FOUND"
}
```

#### 4. Conflict Errors (409)

```typescript
{
  "success": false,
  "message": "Product with this SKU already exists",
  "error_code": "SKU_CONFLICT"
}
```

### Error Handling Implementation

```typescript
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: ValidationError[]
  ) {
    super(message);
    this.name = 'APIError';
  }
}

const handleAPIError = (error: APIError) => {
  switch (error.status) {
    case 400:
      // Handle validation errors
      if (error.errors) {
        displayValidationErrors(error.errors);
      } else {
        showErrorMessage(error.message);
      }
      break;
      
    case 401:
      // Handle authentication errors
      redirectToLogin();
      break;
      
    case 404:
      showErrorMessage('Product not found');
      break;
      
    case 409:
      showErrorMessage('A product with this SKU already exists');
      break;
      
    case 500:
      showErrorMessage('An unexpected error occurred. Please try again.');
      break;
      
    default:
      showErrorMessage(error.message || 'An error occurred');
  }
};
```

---

## Implementation Examples

### Complete Product Management Component (React)

```typescript
const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ProductListFilters>({});
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  
  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listProducts(filters);
      setProducts(response.products);
      setPagination(response.pagination);
    } catch (error) {
      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // Load products on mount and filter changes
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);
  
  // Handle search
  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ProductListFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };
  
  return (
    <div className="product-management">
      <ProductFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />
      
      <ProductList
        products={products}
        loading={loading}
        onProductSelect={handleProductSelect}
      />
      
      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.total_pages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};
```

### Product Form Component

```typescript
const ProductForm: React.FC<{ productId?: string }> = ({ productId }) => {
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    sku: '',
    base_price: 0,
    track_inventory: true,
    stock_quantity: 0,
    low_stock_threshold: 10,
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!!productId);
  
  // Load product data for editing
  useEffect(() => {
    if (productId) {
      loadProductData(productId);
    }
  }, [productId]);
  
  const loadProductData = async (id: string) => {
    try {
      const product = await getProduct(id);
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description,
        category_id: product.category_id,
        brand: product.brand,
        tags: product.tags,
        base_price: product.base_price,
        sale_price: product.sale_price,
        cost_price: product.cost_price,
        stock_quantity: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold,
        track_inventory: product.track_inventory,
        weight: product.weight,
        dimensions_length: product.dimensions_length,
        dimensions_width: product.dimensions_width,
        dimensions_height: product.dimensions_height,
        meta_title: product.meta_title,
        meta_description: product.meta_description,
        slug: product.slug,
      });
    } catch (error) {
      handleAPIError(error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateProductForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (isEditing && productId) {
        await updateProduct(productId, formData);
        showSuccessMessage('Product updated successfully!');
      } else {
        await createProduct(formData);
        showSuccessMessage('Product created successfully!');
      }
      
      // Navigate back to product list
      navigateToProductList();
      
    } catch (error) {
      handleAPIError(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="product-form">
      {/* Form implementation */}
    </form>
  );
};
```

---

## Best Practices

### 1. Performance Optimization

- **Implement pagination**: Always use pagination for product lists
- **Debounce search**: Implement search debouncing to reduce API calls
- **Cache responses**: Cache product data where appropriate
- **Lazy loading**: Load product images and details on demand

### 2. User Experience

- **Loading states**: Show loading indicators during API calls
- **Error feedback**: Provide clear, actionable error messages
- **Form validation**: Validate forms both client-side and server-side
- **Auto-save drafts**: Consider auto-saving form data as drafts
- **Image placeholders**: Always provide fallback images or placeholders
- **Progressive image loading**: Implement lazy loading for better performance

### 3. Data Management

- **Optimistic updates**: Update UI immediately for better perceived performance
- **State management**: Use proper state management (Redux, Zustand, etc.)
- **Data normalization**: Normalize product data in your state store
- **Real-time updates**: Consider WebSocket connections for real-time inventory updates

### 4. Security

- **Input sanitization**: Sanitize all user inputs
- **XSS prevention**: Escape HTML content properly
- **CSRF protection**: Implement CSRF tokens where necessary
- **Rate limiting**: Implement client-side rate limiting for API calls

### 5. Accessibility

- **Keyboard navigation**: Ensure all functionality is keyboard accessible
- **Screen readers**: Use proper ARIA labels and semantic HTML
- **Color contrast**: Maintain proper color contrast ratios
- **Focus management**: Manage focus properly in modals and forms

### 6. Image Handling Best Practices

- **Always use include=images**: When displaying products, always include images in the API call
- **Handle missing images**: Implement proper fallbacks for products without images
- **Optimize image loading**: Use lazy loading and appropriate image sizes
- **Primary image priority**: Always display the primary image first, fallback to first image
- **Error handling**: Implement proper error handling for failed image loads
- **Responsive images**: Consider using different image sizes for different screen sizes
- **Alt text**: Always provide meaningful alt text for accessibility
- **Image caching**: Leverage browser caching for better performance

### 7. Testing

- **Unit tests**: Test individual components and functions
- **Integration tests**: Test API integration
- **E2E tests**: Test complete user workflows
- **Error scenarios**: Test error handling thoroughly
- **Image loading tests**: Test image loading, error states, and fallbacks

---

## Product Image Upload Implementation Plan

### Current State Analysis

The existing ProductForm component has basic image upload UI but lacks actual file upload functionality:

- ✅ File input with drag-and-drop support
- ✅ Image preview functionality  
- ✅ Client-side validation (5MB limit, image types)
- ❌ Actual file upload to cloud storage
- ❌ Backend image upload endpoint
- ❌ Progress tracking and error handling

### Implementation Phases

#### Phase 1: Backend Image Upload Endpoint

**1.1 Create Image Upload API Endpoint**
```yaml
# Add to OpenAPI specification
/api/v1/uploads/product-images:
  post:
    tags:
      - Product Management
    summary: Upload product image
    description: Upload a single product image to cloud storage (Cloudflare R2)
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: object
            required:
              - file
            properties:
              file:
                type: string
                format: binary
                description: Image file (max 5MB, JPEG/PNG/GIF/WebP)
              alt_text:
                type: string
                description: Alternative text for accessibility
                maxLength: 255
    responses:
      '201':
        description: Image uploaded successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Image uploaded successfully"
                data:
                  type: object
                  properties:
                    image_url:
                      type: string
                      format: uri
                      example: "https://pub-123.r2.dev/products/image1.jpg"
                    image_id:
                      type: string
                      example: "img-001"
                    file_size:
                      type: integer
                      example: 1024000
                    dimensions:
                      type: object
                      properties:
                        width:
                          type: integer
                          example: 1200
                        height:
                          type: integer
                          example: 800
      '400':
        $ref: '#/components/responses/BadRequest'
      '401':
        $ref: '#/components/responses/Unauthorized'
      '413':
        description: File too large
      '415':
        description: Unsupported media type
```

**Status: ⏳ Pending Backend Implementation**

#### Phase 2: Frontend Image Upload Service

**2.1 Create Image Upload Service**
```typescript
// src/services/image-upload.ts
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

export class ImageUploadService {
  private static instance: ImageUploadService;
  
  static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  async uploadProductImage(
    file: File,
    onProgress?: (progress: ImageUploadProgress) => void
  ): Promise<ImageUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          });
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.data);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
      
      xhr.open('POST', '/api/v1/uploads/product-images');
      xhr.setRequestHeader('Authorization', `Bearer ${getAuthToken()}`);
      xhr.send(formData);
    });
  }

  async uploadMultipleImages(
    files: File[],
    onProgress?: (fileIndex: number, progress: ImageUploadProgress) => void
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadProductImage(
        files[i],
        (progress) => onProgress?.(i, progress)
      );
      results.push(result);
    }
    
    return results;
  }
}
```

**Status: ⏳ Ready for Implementation**

#### Phase 3: Enhanced ProductForm Component

**3.1 Update Image Upload Logic**
```typescript
// Enhanced handleImageUpload function
const handleImageUpload = useCallback(async (files: FileList) => {
  const imageUploadService = ImageUploadService.getInstance();
  const currentImages = getValues('images') || [];
  
  for (const file of Array.from(files)) {
    // Validation
    const validationError = validateImageUpload(file);
    if (validationError) {
      toast.error(validationError);
      continue;
    }

    const imageId = `uploading-${Date.now()}-${Math.random()}`;
    setUploadingImages(prev => [...prev, imageId]);
    setUploadProgress(prev => ({ ...prev, [imageId]: 0 }));

    try {
      const result = await imageUploadService.uploadProductImage(
        file,
        (progress) => {
          setUploadProgress(prev => ({ 
            ...prev, 
            [imageId]: progress.percentage 
          }));
        }
      );
      
      setValue('images', [...currentImages, result.image_url], { 
        shouldDirty: true 
      });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImages(prev => prev.filter(id => id !== imageId));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[imageId];
        return newProgress;
      });
    }
  }
}, [getValues, setValue]);

// Enhanced validation
const validateImageUpload = (file: File): string | null => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return 'Please upload only JPEG, PNG, GIF, or WebP images';
  }

  if (file.size > maxSize) {
    return 'Image size must be less than 5MB';
  }

  return null;
};
```

**Status: ⏳ Ready for Implementation**

**3.2 Enhanced UI with Progress Indicators**
```typescript
// Add progress tracking state
const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

// Enhanced image upload UI
{uploadingImages.map(imageId => (
  <div key={imageId} className="relative">
    <div className="w-full h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin mb-2" />
      <p className="text-sm text-gray-600 mb-1">Uploading...</p>
      <div className="w-3/4 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${uploadProgress[imageId] || 0}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {uploadProgress[imageId] || 0}%
      </p>
    </div>
  </div>
))}
```

**Status: ⏳ Ready for Implementation**

#### Phase 4: Advanced Image Management Features

**4.1 Image Reordering (Drag & Drop)**
```typescript
// Add react-beautiful-dnd dependency
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const handleImageReorder = useCallback((result: DropResult) => {
  if (!result.destination) return;
  
  const currentImages = getValues('images') || [];
  const items = Array.from(currentImages);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);
  
  setValue('images', items, { shouldDirty: true });
}, [getValues, setValue]);
```

**Status: ⏳ Future Enhancement**

**4.2 Primary Image Selection**
```typescript
// Add primary image index to form data
interface ProductFormData {
  // ... existing fields
  images?: string[];
  primary_image_index?: number;
}

const handleSetPrimaryImage = useCallback((index: number) => {
  setValue('primary_image_index', index, { shouldDirty: true });
  toast.success('Primary image updated');
}, [setValue]);
```

**Status: ⏳ Future Enhancement**

#### Phase 5: Error Handling & Validation

**5.1 Comprehensive Error Handling**
```typescript
// Enhanced error handling with retry logic
const uploadWithRetry = async (
  file: File, 
  maxRetries: number = 3
): Promise<ImageUploadResult> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await imageUploadService.uploadProductImage(file);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
  
  throw lastError!;
};
```

**Status: ⏳ Future Enhancement**

#### Phase 6: Performance Optimizations

**6.1 Image Compression**
```typescript
// Add browser-image-compression library
import imageCompression from 'browser-image-compression';

const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return file;
  }
};
```

**Status: ⏳ Future Enhancement**

### Implementation Status Tracking

| Phase | Component | Status | Notes |
|-------|-----------|--------|-------|
| 1 | Backend Upload Endpoint | ⏳ Pending | Requires backend team |
| 2 | Image Upload Service | ✅ Completed | Implemented with progress tracking |
| 3 | Enhanced ProductForm | ✅ Completed | Added real upload functionality & UI |
| 4 | Advanced Features | ⏳ Future | Nice-to-have features |
| 5 | Error Handling | ✅ Completed | Comprehensive error handling added |
| 6 | Performance Opts | ⏳ Future | Optimization phase |

### Recent Implementation Details

**✅ Completed (Latest Session):**
- **ImageUploadService** (`src/services/image-upload.ts`): Full service with validation, progress tracking, retry logic, and error handling
- **Enhanced ProductForm** (`src/components/products/ProductForm.tsx`): Integrated real upload functionality with progress indicators
- **Progress UI**: Real-time upload progress bars with file size display
- **Validation**: Client-side file type and size validation
- **Error Handling**: Comprehensive error handling with user-friendly messages

### Testing Strategy

1. **Unit Tests**: Image upload service, validation functions
2. **Integration Tests**: Complete upload flow from UI to backend
3. **E2E Tests**: Product creation with multiple images
4. **Performance Tests**: Large files, multiple uploads
5. **Error Tests**: Network failures, invalid files, server errors

### Next Steps

1. ✅ Document implementation plan
2. ✅ Implement image upload service
3. ✅ Enhance ProductForm component
4. ✅ Add comprehensive error handling
5. ✅ Implement progress tracking UI
6. ⏳ Test the complete implementation
7. ⏳ Backend endpoint implementation (requires backend team)
8. ⏳ Add advanced features (image reordering, primary selection)

---

## Conclusion

This guide provides a comprehensive foundation for implementing product management in your admin frontend. Remember to:

1. **Always validate data** both client-side and server-side
2. **Handle errors gracefully** with clear user feedback
3. **Implement proper loading states** for better UX
4. **Use TypeScript** for better type safety
5. **Follow the API specifications** exactly as documented
6. **Test thoroughly** including edge cases and error scenarios

For additional support or questions about specific implementation details, refer to the API documentation or contact the backend development team.