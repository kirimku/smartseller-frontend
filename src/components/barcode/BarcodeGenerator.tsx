import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { enhancedApiClient } from '../../lib/security/enhanced-api-client';

interface BarcodeGenerationForm {
  product_id: string;
  quantity: number;
  batch_name?: string;
  notes?: string;
  expiry_months: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface GenerationResult {
  total_processed: number;
  success_count: number;
  failure_count: number;
  processing_time: string;
  batch_id?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ProductsResponse {
  products: Product[];
  pagination?: {
    page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export const BarcodeGenerator: React.FC = () => {
  const [formData, setFormData] = useState<BarcodeGenerationForm>({
    product_id: '',
    quantity: 1,
    batch_name: '',
    notes: '',
    expiry_months: 12
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        console.log('🔍 [BarcodeGenerator] About to fetch products...');
        
        // Check token status
        const token = localStorage.getItem('smartseller_access_token');
        const expiry = localStorage.getItem('smartseller_token_expiry');
        console.log('🔍 [BarcodeGenerator] Token available:', !!token);
        console.log('🔍 [BarcodeGenerator] Token expiry:', expiry);
        if (expiry) {
          const expiryDate = new Date(expiry);
          const now = new Date();
          console.log('🔍 [BarcodeGenerator] Token expired:', now >= expiryDate);
        }
        
        console.log('🔍 [BarcodeGenerator] Enhanced API Client instance:', enhancedApiClient);
        console.log('🔍 [BarcodeGenerator] Enhanced API Client axios instance:', enhancedApiClient.getClient().instance);
        
        const response = await enhancedApiClient.getClient().get({
          url: '/api/v1/products',
          params: { limit: 100 } // Get first 100 products
        });
        
        console.log('🔍 [BarcodeGenerator] Products response:', response);
        
        const apiResponse = response.data as ApiResponse<ProductsResponse>;
        if (apiResponse?.success && apiResponse?.data?.products) {
          setProducts(apiResponse.data.products);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        toast({
          title: "Error",
          description: "Failed to load products. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await enhancedApiClient.getClient().post({
        url: '/api/v1/admin/warranty/barcodes/generate',
        body: formData
      });
      
      const apiResponse = response.data as ApiResponse<GenerationResult>;
      if (apiResponse?.success && apiResponse.data) {
        const resultData = apiResponse.data;
        setResult(resultData);
        toast({
          title: "Success!",
          description: `Successfully generated ${resultData.success_count} barcodes!`,
        });
        
        // Reset form after successful generation
        setFormData({
          product_id: '',
          quantity: 1,
          batch_name: '',
          notes: '',
          expiry_months: 12
        });
      } else {
        throw new Error(apiResponse?.message || 'Generation failed');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Network error occurred';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BarcodeGenerationForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Generate Warranty Barcodes
          </CardTitle>
          <CardDescription>
            Create new warranty barcodes for your products. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="product_id">Product *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => handleInputChange('product_id', value)}
                disabled={loadingProducts}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select a product"} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity and Warranty Period - Responsive Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                  placeholder="Enter quantity (1-1000)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_months">Warranty Period (Months) *</Label>
                <Input
                  id="expiry_months"
                  type="number"
                  min="1"
                  max="120"
                  value={formData.expiry_months}
                  onChange={(e) => handleInputChange('expiry_months', parseInt(e.target.value) || 12)}
                  placeholder="Enter warranty period in months (1-120)"
                  required
                />
              </div>
            </div>

            {/* Batch Name - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="batch_name">Batch Name</Label>
              <Input
                id="batch_name"
                type="text"
                maxLength={100}
                value={formData.batch_name}
                onChange={(e) => handleInputChange('batch_name', e.target.value)}
                placeholder="e.g., Production Batch #001"
              />
            </div>

            {/* Notes - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                maxLength={500}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this batch..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={loading || !formData.product_id || loadingProducts}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Barcodes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Generation Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.total_processed}</div>
                <div className="text-sm text-muted-foreground">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.success_count}</div>
                <div className="text-sm text-muted-foreground">Success Count</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.failure_count}</div>
                <div className="text-sm text-muted-foreground">Failure Count</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{result.processing_time}</div>
                <div className="text-sm text-muted-foreground">Processing Time</div>
              </div>
            </div>
            {result.batch_id && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">Batch ID:</div>
                <div className="text-sm font-mono text-muted-foreground">{result.batch_id}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};