import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Package,
  DollarSign,
  Hash,
  Ruler,
  Weight,
  Settings,
  Shuffle,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type ProductFormData,
  type ProductFormErrors,
  type ProductResponse,
  type CreateProductRequest,
  type UpdateProductRequest,
  type VariantOptionFormData,
  type VariantFormData,
} from '../../shared/types/product-management';
import { ProductFormSchema, ValidationHelpers, ValidationMessages } from '../../shared/utils/validation';
import { productService } from '../../services/product';
import { CategoryService } from '../../services/categoryService';
import { imageUploadService, type ImageUploadProgress } from '../../services/image-upload';

// Use the comprehensive validation schema
const productFormSchema = ProductFormSchema;

type ProductFormValues = z.infer<typeof productFormSchema>;

export interface ProductFormProps {
  product?: ProductResponse;
  mode: 'create' | 'edit';
  onSubmit?: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
  onSuccess?: (product: ProductResponse) => void;
  onError?: (error: string) => void;
  className?: string;
  showAdvanced?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

// Categories will be loaded from API

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  mode,
  onSubmit,
  onCancel,
  onSuccess,
  onError,
  className = '',
  showAdvanced = true,
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds
}) => {
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, ImageUploadProgress>>({});
  const [fieldValidationErrors, setFieldValidationErrors] = useState<Record<string, string>>({});
  
  // Category state
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);
        const categoryOptions = await CategoryService.getCategoriesForDropdown();
        setCategories(categoryOptions);
      } catch (error) {
        console.error('Failed to load categories:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load categories';
        setCategoriesError(errorMessage);
        
        // Show different toast messages based on error type
        if (errorMessage.includes('Authentication required')) {
          toast.error('Please log in to access categories');
        } else {
          toast.error('Failed to load categories');
        }
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Initialize form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      category_id: product?.category_id || '',
      sku: product?.sku || '',
      stock_quantity: product?.stock_quantity || 0,
      weight: product?.weight || undefined,
      dimensions: product?.dimensions || {
        length: undefined,
        width: undefined,
        height: undefined,
      },
      images: product?.images || [],
      is_active: product?.is_active ?? true,
    },
    mode: 'onChange',
  });

  const { watch, setValue, getValues, formState: { errors, isValid } } = form;

  // Create debounced validators for real-time validation
  const debouncedValidators = {
    name: ValidationHelpers.createDebouncedValidator(
      (value: string) => ValidationHelpers.validateField('name', value),
      300
    ),
    sku: ValidationHelpers.createDebouncedValidator(
      (value: string) => ValidationHelpers.validateField('sku', value),
      500
    ),
    price: ValidationHelpers.createDebouncedValidator(
      (value: number) => ValidationHelpers.validateField('price', value),
      300
    ),
  };

  // Real-time field validation
  const validateFieldRealTime = useCallback((fieldName: string, value: string | number) => {
    const validator = debouncedValidators[fieldName as keyof typeof debouncedValidators];
    if (validator) {
      validator(value, (result) => {
        setFieldValidationErrors(prev => ({
          ...prev,
          [fieldName]: result.error || '',
        }));
      });
    }
  }, []);

  // Watch for changes to mark form as dirty
  useEffect(() => {
    const subscription = watch(() => {
      setIsDirty(true);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty || mode === 'create') return;

    const interval = setInterval(async () => {
      if (isDirty && isValid && product?.id) {
        try {
          const formData = getValues();
          await productService.updateProduct(product.id, formData);
          setLastSaved(new Date());
          setIsDirty(false);
          toast.success('Changes saved automatically');
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, isDirty, isValid, product?.id, autoSaveInterval, getValues]);

  // Handle form submission
  const handleSubmit = useCallback(async (data: ProductFormValues) => {
    try {
      setIsSubmitting(true);

      if (onSubmit) {
        // Convert form values to ProductFormData format for custom onSubmit handler
        const formData: ProductFormData = {
          name: data.name,
          description: data.description,
          price: data.price,
          category_id: data.category_id,
          sku: data.sku,
          stock_quantity: data.stock_quantity,
          weight: data.weight,
          dimensions: data.dimensions,
          images: data.images,
          is_active: data.is_active,
          enable_variants: data.enable_variants,
          auto_generate_variants: data.auto_generate_variants,
          variant_options: data.variant_options,
          variants: data.variants,
        };
        await onSubmit(formData);
      } else {
        let result: ProductResponse;
        
        if (mode === 'create') {
          // Create base product payload (excluding variant fields)
          const createProductData: CreateProductRequest = {
            name: data.name,
            description: data.description,
            price: data.price, // API expects 'price' not 'base_price'
            category_id: data.category_id,
            sku: data.sku,
            stock_quantity: data.stock_quantity,
            weight: data.weight,
            // Note: dimensions, images, and variant fields are not part of CreateProductRequest
          };
          
          result = await productService.createProduct(createProductData);
          toast.success('Product created successfully');
        } else if (product?.id) {
          result = await productService.updateProduct(product.id, formData as UpdateProductRequest);
          toast.success('Product updated successfully');
        } else {
          throw new Error('Product ID is required for updates');
        }

        // Handle variant creation if variants are enabled
        if (data.enable_variants && result.id) {
          try {
            // Step 1: Create variant options if they exist
            if (data.variant_options && data.variant_options.length > 0) {
              for (const option of data.variant_options) {
                if (option.name && option.values && option.values.length > 0) {
                  await productService.createVariantOptions(result.id, {
                    option_name: option.name,
                    option_values: option.values.filter(value => value.trim() !== ''),
                  });
                }
              }
              toast.success('Variant options created successfully');
            }

            // Step 2: Handle variant generation
            if (data.auto_generate_variants && data.variant_options && data.variant_options.length > 0) {
              // Auto-generate variants
              const generateRequest = {
                base_price: data.price,
                stock_quantity: data.stock_quantity,
                weight: data.weight,
              };
              
              await productService.generateVariants(result.id, generateRequest);
              toast.success('Product variants generated automatically');
            } else if (data.variants && data.variants.length > 0) {
              // Create manual variants
              for (const variant of data.variants) {
                if (variant.sku && variant.price !== undefined && variant.stock_quantity !== undefined) {
                  await productService.createVariant(result.id, {
                    variant_options: variant.combination || {},
                    sku: variant.sku,
                    base_price: variant.price,
                    stock_quantity: variant.stock_quantity,
                    weight: variant.weight,
                    is_active: variant.is_active ?? true,
                  });
                }
              }
              toast.success('Product variants created successfully');
            }
          } catch (variantError) {
            console.error('Variant creation failed:', variantError);
            toast.error('Product created but variant creation failed. You can add variants later.');
          }
        }

        setIsDirty(false);
        setLastSaved(new Date());
        onSuccess?.(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save product';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, product?.id, onSubmit, onSuccess, onError]);

  // Handle image upload
  const handleImageUpload = useCallback(async (files: FileList) => {
    const currentImages = getValues('images') || [];
    const fileArray = Array.from(files);
    
    // Validate files before uploading
    const validFiles = fileArray.filter(file => {
      const validationError = imageUploadService.validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    // Create upload IDs and track progress
    const uploadIds = validFiles.map(() => `upload-${Date.now()}-${Math.random()}`);
    
    // Add to uploading state
    setUploadingImages(prev => [...prev, ...uploadIds]);

    try {
      // Upload files with progress tracking
      const uploadPromises = validFiles.map(async (file, index) => {
        const uploadId = uploadIds[index];
        
        try {
          const result = await imageUploadService.uploadProductImage(
            file,
            (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [uploadId]: progress
              }));
            }
          );

          // Clean up progress tracking
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[uploadId];
            return newProgress;
          });

          return result.image_url;
        } catch (error) {
          // Clean up progress tracking on error
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[uploadId];
            return newProgress;
          });
          
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
          throw error;
        }
      });

      // Wait for all uploads to complete
      const uploadedUrls = await Promise.allSettled(uploadPromises);
      const successfulUrls = uploadedUrls
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map(result => result.value);

      if (successfulUrls.length > 0) {
        // Update form with new image URLs
        setValue('images', [...currentImages, ...successfulUrls], { shouldDirty: true });
        
        const successCount = successfulUrls.length;
        const totalCount = validFiles.length;
        
        if (successCount === totalCount) {
          toast.success(`Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}`);
        } else {
          toast.success(`Successfully uploaded ${successCount} of ${totalCount} images`);
        }
      }
    } catch (error) {
      // This catch block handles any unexpected errors
      console.error('Unexpected error during image upload:', error);
      toast.error('An unexpected error occurred during upload');
    } finally {
      // Clean up uploading state
      setUploadingImages(prev => prev.filter(id => !uploadIds.includes(id)));
    }
  }, [getValues, setValue]);

  // Handle image removal
  const handleImageRemove = useCallback((index: number) => {
    const currentImages = getValues('images') || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setValue('images', newImages, { shouldDirty: true });
  }, [getValues, setValue]);

  // Generate SKU
  const generateSKU = useCallback(() => {
    const name = getValues('name');
    const category = getValues('category_id');
    
    if (!name || !category) {
      toast.error('Please enter product name and category first');
      return;
    }

    const namePrefix = name.substring(0, 3).toUpperCase();
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    const sku = `${namePrefix}-${categoryPrefix}-${timestamp}`;
    
    setValue('sku', sku, { shouldDirty: true });
  }, [getValues, setValue]);

  const watchedImages = watch('images') || [];

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {mode === 'create' ? 'Create Product' : 'Edit Product'}
              </CardTitle>
              <CardDescription>
                {mode === 'create' 
                  ? 'Add a new product to your catalog'
                  : 'Update product information'
                }
              </CardDescription>
            </div>
            {autoSave && lastSaved && (
              <div className="text-sm text-muted-foreground">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Validation Errors Display */}
              {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Please fix the following errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {Object.entries(errors).map(([field, error]) => (
                          <li key={field}>
                            <span className="font-medium capitalize">{field.replace('_', ' ')}:</span>{' '}
                            {error?.message || 'Invalid value'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter product name" 
                            {...field}
                            onChange={(e) => {
                              const sanitized = ValidationHelpers.sanitizeInput(e.target.value, 'text');
                              field.onChange(sanitized);
                              validateFieldRealTime('name', sanitized);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        {fieldValidationErrors.name && (
                          <p className="text-sm text-destructive">{fieldValidationErrors.name}</p>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={categoriesLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue 
                                placeholder={
                                  categoriesLoading 
                                    ? "Loading categories..." 
                                    : categoriesError 
                                      ? "Error loading categories" 
                                      : "Select a category"
                                } 
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesLoading ? (
                              <div className="flex items-center justify-center gap-2 p-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading categories...
                              </div>
                            ) : categoriesError ? (
                              <div className="flex items-center justify-center gap-2 p-2 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                Failed to load categories
                              </div>
                            ) : categories.length === 0 ? (
                              <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                                No categories available
                              </div>
                            ) : (
                              categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {categoriesError && (
                          <p className="text-sm text-destructive">{categoriesError}</p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter product description"
                          className="min-h-[100px]"
                          {...field}
                          onChange={(e) => {
                            const sanitized = ValidationHelpers.sanitizeInput(e.target.value, 'text');
                            field.onChange(sanitized);
                            validateFieldRealTime('description', sanitized);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of your product (10-2000 characters)
                      </FormDescription>
                      <FormMessage />
                      {fieldValidationErrors.description && (
                        <p className="text-sm text-destructive">{fieldValidationErrors.description}</p>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Pricing and Inventory */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing & Inventory</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-10"
                              {...field}
                              onChange={(e) => {
                                const sanitized = ValidationHelpers.sanitizeInput(e.target.value, 'number');
                                const numValue = parseFloat(sanitized) || 0;
                                field.onChange(numValue);
                                validateFieldRealTime('price', numValue);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        {fieldValidationErrors.price && (
                          <p className="text-sm text-destructive">{fieldValidationErrors.price}</p>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Product SKU"
                                className="pl-10"
                                {...field}
                                onChange={(e) => {
                                  const sanitized = ValidationHelpers.sanitizeInput(e.target.value, 'text');
                                  field.onChange(sanitized);
                                  validateFieldRealTime('sku', sanitized);
                                }}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={generateSKU}
                            >
                              Generate
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Unique identifier for inventory tracking (3-50 characters, alphanumeric with hyphens/underscores)
                        </FormDescription>
                        <FormMessage />
                        {fieldValidationErrors.sku && (
                          <p className="text-sm text-destructive">{fieldValidationErrors.sku}</p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              {showAdvanced && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Physical Properties</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="pl-10"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dimensions.length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length (cm)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  placeholder="0.0"
                                  className="pl-10"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dimensions.width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width (cm)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  placeholder="0.0"
                                  className="pl-10"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dimensions.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  placeholder="0.0"
                                  className="pl-10"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Product Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Product Images</h3>
                
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Drag and drop images here, or click to select files
                        </p>
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                          className="hidden"
                          id="image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Images
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                      </p>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {uploadingImages.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Uploading Images...</h4>
                      {uploadingImages.map((uploadId) => {
                        const progress = uploadProgress[uploadId];
                        return (
                          <div key={uploadId} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {progress ? `Uploading... ${progress.percentage}%` : 'Preparing upload...'}
                              </span>
                              {progress && (
                                <span className="text-xs text-muted-foreground">
                                  {imageUploadService.formatFileSize(progress.loaded)} / {imageUploadService.formatFileSize(progress.total)}
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress?.percentage || 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Image Preview */}
                  {watchedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {watchedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleImageRemove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Status</h3>
                
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Active Product
                        </FormLabel>
                        <FormDescription>
                          When enabled, this product will be visible and available for purchase
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Product Variants */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Product Variants
                  </h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="enable_variants"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Enable Product Variants
                        </FormLabel>
                        <FormDescription>
                          Create multiple variations of this product (e.g., different sizes, colors, materials)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Variant Options Section */}
                {watch('enable_variants') && (
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Variant Options
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentOptions = watch('variant_options') || [];
                          setValue('variant_options', [
                            ...currentOptions,
                            { name: '', values: [''] }
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>

                    <FormDescription>
                      Define the types of variations for this product (e.g., Size, Color, Material)
                    </FormDescription>

                    {/* Variant Options List */}
                    <div className="space-y-3">
                      {(watch('variant_options') || []).map((option, optionIndex) => (
                        <div key={optionIndex} className="border rounded-lg p-3 bg-background">
                          <div className="flex items-center justify-between mb-3">
                            <FormField
                              control={form.control}
                              name={`variant_options.${optionIndex}.name`}
                              render={({ field }) => (
                                <FormItem className="flex-1 mr-2">
                                  <FormControl>
                                    <Input
                                      placeholder="Option name (e.g., Size, Color)"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentOptions = watch('variant_options') || [];
                                const newOptions = currentOptions.filter((_, i) => i !== optionIndex);
                                setValue('variant_options', newOptions);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Option Values */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Values</Label>
                            {(option.values || ['']).map((value, valueIndex) => (
                              <div key={valueIndex} className="flex items-center gap-2">
                                <FormField
                                  control={form.control}
                                  name={`variant_options.${optionIndex}.values.${valueIndex}`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input
                                          placeholder="Value (e.g., Small, Red)"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const currentOptions = watch('variant_options') || [];
                                    const newOptions = [...currentOptions];
                                    if (newOptions[optionIndex]) {
                                      newOptions[optionIndex].values = newOptions[optionIndex].values.filter((_, i) => i !== valueIndex);
                                      setValue('variant_options', newOptions);
                                    }
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentOptions = watch('variant_options') || [];
                                const newOptions = [...currentOptions];
                                if (newOptions[optionIndex]) {
                                  newOptions[optionIndex].values.push('');
                                  setValue('variant_options', newOptions);
                                }
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Value
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Auto-generate Variants Option */}
                    {(watch('variant_options') || []).length > 0 && (
                      <div className="space-y-4 border-t pt-4">
                        <FormField
                          control={form.control}
                          name="auto_generate_variants"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Auto-generate Variants
                                </FormLabel>
                                <FormDescription>
                                  Automatically create all possible combinations of variant options
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {watch('auto_generate_variants') && (
                          <Alert>
                            <Shuffle className="h-4 w-4" />
                            <AlertDescription>
                              Variants will be automatically generated with default pricing and stock based on your base product settings. You can adjust individual variant details after creation.
                            </AlertDescription>
                          </Alert>
                        )}

                        {!watch('auto_generate_variants') && (watch('variant_options') || []).length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">Manual Variants</h5>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentVariants = watch('variants') || [];
                                  setValue('variants', [
                                    ...currentVariants,
                                    {
                                      combination: {},
                                      sku: '',
                                      price: watch('price') || 0,
                                      stock_quantity: watch('stock_quantity') || 0,
                                      weight: watch('weight'),
                                      is_active: true,
                                    }
                                  ]);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Variant
                              </Button>
                            </div>

                            <FormDescription>
                              Manually create specific product variants with custom pricing and stock
                            </FormDescription>

                            {/* Manual Variants List */}
                            <div className="space-y-3">
                              {(watch('variants') || []).map((variant, variantIndex) => (
                                <div key={variantIndex} className="border rounded-lg p-3 bg-background">
                                  <div className="flex items-center justify-between mb-3">
                                    <h6 className="font-medium">Variant {variantIndex + 1}</h6>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const currentVariants = watch('variants') || [];
                                        const newVariants = currentVariants.filter((_, i) => i !== variantIndex);
                                        setValue('variants', newVariants);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <FormField
                                      control={form.control}
                                      name={`variants.${variantIndex}.sku`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>SKU *</FormLabel>
                                          <FormControl>
                                            <Input
                                              placeholder="Variant SKU"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`variants.${variantIndex}.price`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Price *</FormLabel>
                                          <FormControl>
                                            <div className="relative">
                                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                              <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                className="pl-10"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                              />
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`variants.${variantIndex}.stock_quantity`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Stock Quantity *</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="0"
                                              placeholder="0"
                                              {...field}
                                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`variants.${variantIndex}.weight`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Weight (kg)</FormLabel>
                                          <FormControl>
                                            <div className="relative">
                                              <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                              <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                className="pl-10"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                              />
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  {/* Variant Combination */}
                                  <div className="mt-3">
                                    <Label className="text-sm font-medium">Variant Combination</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                      {(watch('variant_options') || []).map((option, optionIndex) => (
                                        <FormField
                                          key={optionIndex}
                                          control={form.control}
                                          name={`variants.${variantIndex}.combination.${option.name}`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>{option.name}</FormLabel>
                                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder={`Select ${option.name}`} />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                  {option.values.map((value, valueIndex) => (
                                                    <SelectItem key={valueIndex} value={value}>
                                                      {value}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <div className="mt-3">
                                    <FormField
                                      control={form.control}
                                      name={`variants.${variantIndex}.is_active`}
                                      render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value}
                                              onCheckedChange={field.onChange}
                                            />
                                          </FormControl>
                                          <div className="space-y-1 leading-none">
                                            <FormLabel>
                                              Active Variant
                                            </FormLabel>
                                          </div>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isDirty && (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Unsaved changes
                    </>
                  )}
                  {!isDirty && lastSaved && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      All changes saved
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      if (!isValid) {
                        // Trigger validation and show errors
                        const result = await form.trigger();
                        if (!result) {
                          const formErrors = form.formState.errors;
                          const errorMessages = Object.entries(formErrors).map(([field, error]) => {
                            return `${field}: ${error?.message || 'Invalid value'}`;
                          }).join('\n');
                          
                          toast.error('Please fix the following validation errors:', {
                            description: errorMessages,
                            duration: 5000,
                          });
                          return;
                        }
                      }
                      
                      // If valid, submit the form
                      const formData = getValues();
                      await handleSubmit(formData);
                    }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {mode === 'create' ? 'Create Product' : 'Update Product'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;