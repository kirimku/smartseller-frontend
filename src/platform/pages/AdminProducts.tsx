import { useState, useEffect } from "react";
import { Button } from "@shared/components/ui/button";
import { Card } from "@shared/components/ui/card";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Badge } from "@shared/components/ui/badge";
import { Textarea } from "@shared/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/components/ui/dialog";
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Download,
  Upload,
  Star,
  TrendingUp,
  TrendingDown,
  ImageIcon,
  Tag,
  DollarSign,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { productService } from "../../services/product";
import type { ProductListItem } from "../../generated/api/types.gen";
import { ProductForm } from "../../components/products/ProductForm";
import type { ProductFormData, ProductWithVariants } from "../../shared/types/product-management";

type ProductStatus = "draft" | "active" | "inactive" | "archived";
type ProductCategory = "keyboard" | "mouse" | "headset" | "mousepad" | "chair" | "accessories";

// Map API product to display format
interface DisplayProduct {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  stock: number;
  status: ProductStatus;
  rating: number;
  reviews: number;
  sales: number;
  revenue: number;
  description: string;
  images: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  flashDeal: boolean;
}

// Convert API product to display format
const convertApiProductToDisplay = (apiProduct: ProductListItem): DisplayProduct => {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    sku: apiProduct.sku || `SKU-${apiProduct.id}`,
    category: "accessories" as ProductCategory, // Default category, should be mapped properly
    price: apiProduct.price || 0,
    originalPrice: undefined,
    stock: apiProduct.stock_quantity || 0,
    status: apiProduct.is_active ? "active" : "inactive",
    rating: 4.5, // Default rating, should come from API
    reviews: 0, // Default reviews, should come from API
    sales: 0, // Default sales, should come from API
    revenue: 0, // Default revenue, should come from API
    description: "", // Description not available in ProductListItem
    images: apiProduct.thumbnail ? [apiProduct.thumbnail] : [],
    tags: [], // Default tags, should come from API
    createdAt: new Date().toISOString(), // Created date not available in ProductListItem
    updatedAt: new Date().toISOString(), // Updated date not available in ProductListItem
    featured: false, // Default featured, should come from API
    flashDeal: false, // Default flash deal, should come from API
  };
};

export default function AdminProducts() {
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<DisplayProduct | null>(null);
  const [detailedProduct, setDetailedProduct] = useState<ProductWithVariants | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Load products from API
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading products from API...');
      document.title = 'Loading Products... - SmartSeller';
      
      const result = await productService.getProducts({
        page: 1,
        page_size: 100, // Load more products for demo
        sort_by: 'created_at',
        sort_desc: true,
      });
      
      console.log('✅ Products loaded successfully:', result);
      document.title = `${result.products.length} Products - SmartSeller`;
      
      const displayProducts = result.products.map(convertApiProductToDisplay);
      setProducts(displayProducts);
      
      toast.success(`Loaded ${displayProducts.length} products successfully`);
    } catch (err) {
      console.error('❌ Error loading products:', err);
      document.title = 'Error Loading Products - SmartSeller';
      
      let errorMessage = 'Failed to load products';
      
      // Check if it's a network error (backend not available)
      if (err instanceof Error) {
        if (err.message.includes('Network Error') || 
            err.message.includes('ECONNREFUSED') || 
            err.message.includes('fetch')) {
          const apiBaseUrl = import.meta.env.VITE_BACKEND_HOST || import.meta.env.VITE_API_BASE_URL || 'https://smartseller-api.preproduction.kirimku.com';
          errorMessage = `Backend server is not available. Please ensure the API server is running on ${apiBaseUrl}`;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      toast.error(`Failed to load products: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: ProductStatus) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      draft: "bg-yellow-100 text-yellow-800",
      archived: "bg-red-100 text-red-800"
    };
    
    const icons = {
      active: <CheckCircle className="h-3 w-3 mr-1" />,
      inactive: <XCircle className="h-3 w-3 mr-1" />,
      draft: <Clock className="h-3 w-3 mr-1" />,
      archived: <AlertTriangle className="h-3 w-3 mr-1" />
    };
    
    return (
      <Badge className={variants[status]}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoryBadge = (category: ProductCategory) => {
    const variants = {
      keyboard: "bg-blue-100 text-blue-800",
      mouse: "bg-purple-100 text-purple-800",
      headset: "bg-orange-100 text-orange-800",
      mousepad: "bg-teal-100 text-teal-800",
      chair: "bg-indigo-100 text-indigo-800",
      accessories: "bg-pink-100 text-pink-800"
    };
    
    return <Badge className={variants[category]}>{category.charAt(0).toUpperCase() + category.slice(1)}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewProduct = async (product: DisplayProduct) => {
    setSelectedProduct(product);
    setDetailedProduct(null);
    setIsViewDialogOpen(true);
    
    try {
      setLoadingDetails(true);
      console.log('🔄 Loading product details with variants for:', product.id);
      
      const productWithVariants = await productService.getProductWithDetails(product.id, ['variants']);
      setDetailedProduct(productWithVariants);
      
      console.log('✅ Product details loaded successfully:', productWithVariants);
    } catch (error) {
      console.error('❌ Error loading product details:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEditProduct = (product: DisplayProduct) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.deleteProduct(productId);
        setProducts(products.filter(product => product.id !== productId));
        toast.success("Product deleted successfully");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
        toast.error(`Failed to delete product: ${errorMessage}`);
        console.error('Error deleting product:', err);
      }
    }
  };

  // Helper function to map DisplayProduct to ProductFormData
  const mapProductToFormData = (product: DisplayProduct): ProductFormData => ({
    name: product.name,
    description: product.description,
    base_price: product.price,
    category_id: '', // Will need to map category properly
    sku: product.sku,
    stock_quantity: product.stock,
    weight: 0, // Default weight, not available in DisplayProduct
    dimensions: { length: 0, width: 0, height: 0 }, // Default dimensions
    images: product.images,
    status: product.status,
    enable_variants: false,
    auto_generate_variants: false,
    variant_options: [],
    variants: []
  });

  const productStats = {
    total: products.length,
    active: products.filter(p => p.status === "active").length,
    outOfStock: products.filter(p => p.stock === 0).length,
    featured: products.filter(p => p.featured).length,
    totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
    averageRating: products.length > 0 ? products.reduce((sum, p) => sum + p.rating, 0) / products.length : 0
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Loading products...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading products...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Error loading products</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load products</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            {error.includes('Backend server is not available') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
                <h4 className="font-semibold text-blue-900 mb-2">Development Setup Required:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Start the backend API server on port 8090</li>
                  <li>• Or configure a different API endpoint in .env.development</li>
                  <li>• Or use mock data for frontend-only development</li>
                </ul>
              </div>
            )}
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-2">Manage your product catalog and inventory</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm
                mode="create"
                onSuccess={(product) => {
                  toast.success("Product created successfully!");
                  setIsAddDialogOpen(false);
                  loadProducts(); // Refresh the product list
                }}
                onError={(error) => {
                  console.error("Error creating product:", error);
                  toast.error("Failed to create product. Please try again.");
                }}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900">{productStats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-3xl font-bold text-green-600">{productStats.active}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-600">{productStats.outOfStock}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(productStats.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Top Performing Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Top Selling Products</h3>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {products
                  .sort((a, b) => b.sales - a.sales)
                  .slice(0, 5)
                  .map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sales} sales</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</div>
                      <div className="text-sm text-gray-500">#{index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Low Stock Alert</h3>
                <Button variant="outline" size="sm">Restock</Button>
              </div>
              <div className="space-y-4">
                {products
                  .filter(p => p.stock < 25)
                  .map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-yellow-700">{product.stock} left</div>
                      <div className="text-sm text-yellow-600">Low stock</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {/* Filters and Search */}
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products by name, SKU, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="keyboard">Keyboard</SelectItem>
                    <SelectItem value="mouse">Mouse</SelectItem>
                    <SelectItem value="headset">Headset</SelectItem>
                    <SelectItem value="mousepad">Mousepad</SelectItem>
                    <SelectItem value="chair">Chair</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </Card>

          {/* Products Table */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Products ({filteredProducts.length})</h2>
                <div className="text-sm text-gray-500">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.sku}</div>
                              <div className="text-xs text-gray-400">{product.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryBadge(product.category)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(product.price)}</div>
                            {product.originalPrice && (
                              <div className="text-sm text-gray-500 line-through">
                                {formatCurrency(product.originalPrice)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${
                            product.stock === 0 ? 'text-red-600' : 
                            product.stock < 25 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {product.stock}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{product.rating}</span>
                            <span className="text-sm text-gray-500">({product.reviews})</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.sales}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(product.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProduct(product)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="text-center py-12">
            <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inventory Management</h3>
            <p className="text-gray-600">Track stock levels, manage warehouses, and handle restocking</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Product Analytics</h3>
            <p className="text-gray-600">View detailed analytics and performance metrics for your products</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
                    <p className="text-gray-600">{selectedProduct.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedProduct.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">SKU</Label>
                      <p className="font-medium">{selectedProduct.sku}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Category</Label>
                      <div className="mt-1">{getCategoryBadge(selectedProduct.category)}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Price</Label>
                      <p className="font-medium">{formatCurrency(selectedProduct.price)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Stock</Label>
                      <p className="font-medium">{selectedProduct.stock}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Rating</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{selectedProduct.rating}</span>
                        <span className="text-sm text-gray-500">({selectedProduct.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-gray-600">Total Sales</Label>
                      <p className="font-bold text-lg">{selectedProduct.sales}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Total Revenue</Label>
                      <p className="font-bold text-lg">{formatCurrency(selectedProduct.revenue)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Variants Section */}
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Product Variants
                </h3>
                
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-gray-600">Loading variant details...</span>
                  </div>
                ) : detailedProduct?.variants && detailedProduct.variants.length > 0 ? (
                  <div className="space-y-4">
                    {detailedProduct.variants.map((variant, index) => (
                      <div key={variant.id || index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-gray-600 text-sm">SKU</Label>
                            <p className="font-medium">{variant.sku || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600 text-sm">Price</Label>
                            <p className="font-medium">{variant.price ? formatCurrency(variant.price) : 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600 text-sm">Stock</Label>
                            <p className="font-medium">{variant.stock_quantity || 0}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600 text-sm">Weight</Label>
                            <p className="font-medium">{variant.weight ? `${variant.weight}g` : 'N/A'}</p>
                          </div>
                        </div>
                        
                        {variant.option_values && variant.option_values.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <Label className="text-gray-600 text-sm">Options</Label>
                            <div className="flex gap-2 flex-wrap mt-1">
                              {variant.option_values.map((option, optIndex) => (
                                <Badge key={optIndex} variant="outline" className="text-xs">
                                  {option}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Layers className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No variants available for this product</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm
              mode="edit"
              onSubmit={async (formData) => {
                try {
                  await productService.updateProduct(selectedProduct.id, formData);
                  toast.success("Product updated successfully!");
                  setIsEditDialogOpen(false);
                  loadProducts(); // Refresh the product list
                } catch (error) {
                  console.error("Error updating product:", error);
                  toast.error("Failed to update product. Please try again.");
                }
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
    );
  }