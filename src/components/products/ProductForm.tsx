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
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type ProductFormData,
  type ProductFormErrors,
  type ProductResponse,
  type CreateProductRequest,
  type UpdateProductRequest,
} from '../../shared/types/product-management';
import { ProductFormSchema, ValidationHelpers, ValidationMessages } from '../../shared/utils/validation';
import { productService } from '../../services/product';

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

// Mock categories - in real app, this would come from an API
const PRODUCT_CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'books', label: 'Books' },
  { value: 'home-garden', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'toys', label: 'Toys & Games' },
  { value: 'health', label: 'Health & Beauty' },
  { value: 'automotive', label: 'Automotive' },
];

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
  const [fieldValidationErrors, setFieldValidationErrors] = useState<Record<string, string>>({});

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

      // Convert form values to ProductFormData format
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
      };

      if (onSubmit) {
        await onSubmit(formData);
      } else {
        let result: ProductResponse;
        
        if (mode === 'create') {
          result = await productService.createProduct(formData as CreateProductRequest);
          toast.success('Product created successfully');
        } else if (product?.id) {
          result = await productService.updateProduct(product.id, formData as UpdateProductRequest);
          toast.success('Product updated successfully');
        } else {
          throw new Error('Product ID is required for updates');
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
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        continue;
      }

      const imageId = `temp-${Date.now()}-${Math.random()}`;
      setUploadingImages(prev => [...prev, imageId]);

      try {
        // In a real app, you would upload to a file storage service
        // For now, we'll create a temporary URL
        const imageUrl = URL.createObjectURL(file);
        
        setValue('images', [...currentImages, imageUrl], { shouldDirty: true });
        toast.success('Image uploaded successfully');
      } catch (error) {
        toast.error('Failed to upload image');
      } finally {
        setUploadingImages(prev => prev.filter(id => id !== imageId));
      }
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRODUCT_CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
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
                    type="submit"
                    disabled={isSubmitting || !isValid}
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