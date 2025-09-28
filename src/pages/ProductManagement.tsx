import React, { useState, useCallback } from 'react';
import { Plus, Package, Filter, Download, Upload, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ProductList, ProductForm, ProductFilters } from '../components/products';
import type { ProductResponse, ProductFormData, ProductListItem, ProductListFilters } from '../shared/types/product-management';
import { toast } from 'sonner';

export const ProductManagement: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filters, setFilters] = useState<ProductListFilters>({
    page: 1,
    page_size: 20,
    sort_by: 'created_at',
    sort_desc: true,
  });

  // Mock analytics data - in real app, this would come from an API
  const analyticsData = {
    totalProducts: 156,
    activeProducts: 142,
    lowStockProducts: 8,
    outOfStockProducts: 6,
    totalValue: 45678.90,
    averagePrice: 89.45,
  };

  // Handle product creation
  const handleCreateProduct = useCallback(async (data: ProductFormData) => {
    try {
      // The ProductForm component will handle the actual API call
      setShowCreateDialog(false);
      setRefreshTrigger(prev => prev + 1);
      toast.success('Product created successfully');
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product');
    }
  }, []);

  // Handle product editing
  const handleEditProduct = useCallback((product: ProductListItem) => {
    // Convert ProductListItem to ProductResponse format for editing
    const productForEdit: ProductResponse = {
      id: product.id,
      name: product.name,
      description: '', // Will be loaded when editing
      price: product.price,
      category_id: '', // Will be loaded when editing
      sku: product.sku || '',
      stock_quantity: product.stock_quantity,
      is_active: product.is_active,
      thumbnail: product.thumbnail,
      // Add other required fields with defaults
      weight: undefined,
      dimensions: undefined,
      images: product.thumbnail ? [product.thumbnail] : [],
      created_at: '',
      updated_at: '',
    };
    setEditingProduct(productForEdit);
  }, []);

  // Handle product update
  const handleUpdateProduct = useCallback(async (data: ProductFormData) => {
    try {
      // The ProductForm component will handle the actual API call
      setEditingProduct(null);
      setRefreshTrigger(prev => prev + 1);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product');
    }
  }, []);

  // Handle product deletion
  const handleDeleteProduct = useCallback((product: ProductListItem) => {
    try {
      // In real app, this would call the product service
      setRefreshTrigger(prev => prev + 1);
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  }, []);

  // Handle bulk export
  const handleExport = useCallback(() => {
    toast.info('Export functionality coming soon');
  }, []);

  // Handle bulk import
  const handleImport = useCallback(() => {
    toast.info('Import functionality coming soon');
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: ProductListFilters) => {
    setFilters(newFilters);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    const defaultFilters: ProductListFilters = {
      page: 1,
      page_size: 20,
      sort_by: 'created_at',
      sort_desc: true,
    };
    setFilters(defaultFilters);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8" />
            Product Management
          </h1>
          <p className="text-muted-foreground">
            Manage your product catalog, inventory, and pricing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your catalog with all the necessary details.
                </DialogDescription>
              </DialogHeader>
              <ProductForm
                mode="create"
                onSubmit={handleCreateProduct}
                onCancel={() => setShowCreateDialog(false)}
                onSuccess={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.activeProducts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <span className="text-lg">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: ${analyticsData.averagePrice}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <span className="text-lg">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analyticsData.lowStockProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <span className="text-lg">🚫</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analyticsData.outOfStockProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              Needs restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'list' | 'analytics')}>
        <TabsList>
          <TabsTrigger value="list">Product List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <ProductFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                showAdvanced={true}
                compact={false}
              />
            </div>

            {/* Products List */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Products</CardTitle>
                      <CardDescription>
                        Manage your product catalog with advanced filtering and search
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {analyticsData.totalProducts} total
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Compact Filters for Mobile */}
                  <div className="lg:hidden mb-4">
                    <ProductFilters
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                      onClearFilters={handleClearFilters}
                      showAdvanced={true}
                      compact={true}
                    />
                  </div>
                  
                  <ProductList
                    onEditProduct={handleEditProduct}
                    onDeleteProduct={handleDeleteProduct}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Analytics</CardTitle>
              <CardDescription>
                Detailed insights into your product performance and inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Stock Status Overview */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Stock Status Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">In Stock</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {analyticsData.activeProducts}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(analyticsData.activeProducts / analyticsData.totalProducts) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Low Stock</span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {analyticsData.lowStockProducts}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(analyticsData.lowStockProducts / analyticsData.totalProducts) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Out of Stock</span>
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          {analyticsData.outOfStockProducts}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(analyticsData.outOfStockProducts / analyticsData.totalProducts) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Category Distribution */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Category analytics will be available soon</p>
                    <p className="text-sm">Connect your analytics service to view detailed insights</p>
                  </div>
                </div>

                <Separator />

                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                  <div className="text-center py-12 text-muted-foreground">
                    <span className="text-4xl mb-4 block">📊</span>
                    <p>Performance metrics will be available soon</p>
                    <p className="text-sm">Track sales, views, and conversion rates</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information and settings.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              mode="edit"
              product={editingProduct}
              onSubmit={handleUpdateProduct}
              onCancel={() => setEditingProduct(null)}
              onSuccess={() => setEditingProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;