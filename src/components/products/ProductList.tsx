import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Download,
  Upload,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Package,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type ProductListItem,
  type ProductListFilters,
  type ProductListState,
  type ProductStatusInfo,
  type StockStatusInfo,
  type ProductListResponse,
} from '../../shared/types/product-management';
import { productService } from '../../services/product';
import { formatCurrency, formatDate } from '../../shared/utils/format';

export interface ProductListProps {
  onCreateProduct?: () => void;
  onEditProduct?: (product: ProductListItem) => void;
  onViewProduct?: (product: ProductListItem) => void;
  onDeleteProduct?: (product: ProductListItem) => void;
  className?: string;
  showActions?: boolean;
  showBulkActions?: boolean;
  showFilters?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  selectable?: boolean;
  selectedProducts?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

const PRODUCT_STATUS_INFO: Record<string, ProductStatusInfo> = {
  draft: {
    value: 'draft',
    label: 'Draft',
    color: 'gray',
    description: 'Product is being prepared',
  },
  active: {
    value: 'active',
    label: 'Active',
    color: 'green',
    description: 'Product is available for sale',
  },
  inactive: {
    value: 'inactive',
    label: 'Inactive',
    color: 'yellow',
    description: 'Product is temporarily unavailable',
  },
  archived: {
    value: 'archived',
    label: 'Archived',
    color: 'red',
    description: 'Product is no longer available',
  },
};

const STOCK_STATUS_INFO: Record<string, StockStatusInfo> = {
  in_stock: {
    value: 'in_stock',
    label: 'In Stock',
    color: 'green',
    description: 'Product is available',
  },
  low_stock: {
    value: 'low_stock',
    label: 'Low Stock',
    color: 'yellow',
    description: 'Stock is running low',
  },
  out_of_stock: {
    value: 'out_of_stock',
    label: 'Out of Stock',
    color: 'red',
    description: 'Product is out of stock',
  },
};

const getStockStatus = (stockQuantity: number): StockStatusInfo => {
  if (stockQuantity === 0) return STOCK_STATUS_INFO.out_of_stock;
  if (stockQuantity <= 10) return STOCK_STATUS_INFO.low_stock;
  return STOCK_STATUS_INFO.in_stock;
};

export const ProductList: React.FC<ProductListProps> = ({
  onCreateProduct,
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
  className = '',
  showActions = true,
  showBulkActions = true,
  showFilters = true,
  showSearch = true,
  showPagination = true,
  pageSize = 20,
  selectable = false,
  selectedProducts = [],
  onSelectionChange,
}) => {
  // State
  const [state, setState] = useState<ProductListState>({
    products: [],
    loading: true,
    error: null,
    filters: {
      page: 1,
      page_size: pageSize,
      sort_by: 'created_at',
      sort_desc: true,
    },
    pagination: {
      total: 0,
      per_page: pageSize,
      current_page: 1,
      last_page: 1,
      from: null,
      to: null,
      has_more_pages: false,
    },
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedProducts);

  // Load products
  const loadProducts = useCallback(async (filters?: Partial<ProductListFilters>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const updatedFilters = { ...state.filters, ...filters };
      const response = await productService.getProducts(updatedFilters);
      
      // Handle the nested response structure
      const productData = response.data?.data || [];
      const paginationData = response.data?.meta || state.pagination;
      
      setState(prev => ({
        ...prev,
        products: productData,
        loading: false,
        filters: updatedFilters,
        pagination: {
          total: paginationData.total || 0,
          per_page: paginationData.per_page || pageSize,
          current_page: paginationData.current_page || 1,
          last_page: paginationData.last_page || 1,
          from: paginationData.from || null,
          to: paginationData.to || null,
          has_more_pages: paginationData.has_more_pages || false,
        },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  }, [state.filters, pageSize]);

  // Initial load
  useEffect(() => {
    loadProducts();
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    loadProducts({ search: query, page: 1 });
  }, [loadProducts]);

  // Handle sort
  const handleSort = useCallback((sortBy: ProductListFilters['sort_by']) => {
    const sortDesc = state.filters.sort_by === sortBy ? !state.filters.sort_desc : false;
    loadProducts({ sort_by: sortBy, sort_desc: sortDesc, page: 1 });
  }, [loadProducts, state.filters]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    loadProducts({ page });
  }, [loadProducts]);

  // Handle selection
  const handleSelectProduct = useCallback((productId: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedIds, productId]
      : selectedIds.filter(id => id !== productId);
    
    setSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  }, [selectedIds, onSelectionChange]);

  const handleSelectAll = useCallback((checked: boolean) => {
    const newSelection = checked ? state.products.map(p => p.id) : [];
    setSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  }, [state.products, onSelectionChange]);

  // Handle actions
  const handleDeleteProduct = useCallback(async (product: ProductListItem) => {
    try {
      await productService.deleteProduct(product.id);
      toast.success('Product deleted successfully');
      loadProducts();
      onDeleteProduct?.(product);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      toast.error(errorMessage);
    }
  }, [loadProducts, onDeleteProduct]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    
    try {
      await Promise.all(selectedIds.map(id => productService.deleteProduct(id)));
      toast.success(`${selectedIds.length} products deleted successfully`);
      setSelectedIds([]);
      onSelectionChange?.([]);
      loadProducts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete products';
      toast.error(errorMessage);
    }
  }, [selectedIds, loadProducts, onSelectionChange]);

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusInfo = PRODUCT_STATUS_INFO[status] || PRODUCT_STATUS_INFO.draft;
    return (
      <Badge variant={statusInfo.color === 'green' ? 'default' : 'secondary'}>
        {statusInfo.label}
      </Badge>
    );
  };

  // Render stock badge
  const renderStockBadge = (stockQuantity: number) => {
    const stockInfo = getStockStatus(stockQuantity);
    return (
      <Badge variant={stockInfo.color === 'green' ? 'default' : 'destructive'}>
        {stockInfo.label}
      </Badge>
    );
  };

  // Render loading state
  if (state.loading && state.products.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage your product catalog</CardDescription>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products
            </CardTitle>
            <CardDescription>
              Manage your product catalog ({state.pagination.total} total)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProducts()}
              disabled={state.loading}
            >
              <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {onCreateProduct && (
              <Button onClick={onCreateProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="flex items-center gap-4">
            {showSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            {showFilters && (
              <div className="flex items-center gap-2">
                <Select
                  value={state.filters.status || ''}
                  onValueChange={(value) => loadProducts({ status: value as ProductListFilters['status'], page: 1 })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Bulk Actions */}
        {showBulkActions && selectedIds.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Error State */}
        {state.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!state.loading && state.products.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first product'}
            </p>
            {onCreateProduct && !searchQuery && (
              <Button onClick={onCreateProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        )}

        {/* Products Table */}
        {state.products.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectable && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === state.products.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      {state.filters.sort_by === 'name' && (
                        state.filters.sort_desc ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('base_price')}
                  >
                    <div className="flex items-center gap-2">
                      Price
                      {state.filters.sort_by === 'base_price' && (
                        state.filters.sort_desc ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Created
                      {state.filters.sort_by === 'created_at' && (
                        state.filters.sort_desc ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  {showActions && <TableHead className="w-12">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.products.map((product) => (
                  <TableRow key={product.id}>
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.thumbnail && (
                          <img
                            src={product.thumbnail}
                            alt={product.name}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {product.sku || 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(product.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.stock_quantity}</span>
                        {renderStockBadge(product.stock_quantity)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(product.is_active ? 'active' : 'inactive')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        N/A
                      </div>
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {onViewProduct && (
                              <DropdownMenuItem onClick={() => onViewProduct(product)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                            )}
                            {onEditProduct && (
                              <DropdownMenuItem onClick={() => onEditProduct(product)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {onDeleteProduct && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteProduct(product)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {showPagination && state.pagination.last_page > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {state.pagination.from} to {state.pagination.to} of {state.pagination.total} products
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(state.pagination.current_page - 1)}
                disabled={state.pagination.current_page === 1 || state.loading}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {state.pagination.current_page} of {state.pagination.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(state.pagination.current_page + 1)}
                disabled={!state.pagination.has_more_pages || state.loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductList;