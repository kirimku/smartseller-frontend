import { useState, useEffect } from "react";
import { Button } from "@shared/components/ui/button";
import { Card } from "@shared/components/ui/card";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Badge } from "@shared/components/ui/badge";
import { Separator } from "@shared/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Switch } from "@shared/components/ui/switch";
import { Textarea } from "@shared/components/ui/textarea";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@shared/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@shared/components/ui/alert";
import { 
  QrCode,
  Package,
  Shield,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Send,
  Truck,
  Settings,
  PrinterIcon,
  RefreshCw,
  History,
  CheckSquare,
  X,
  Check,
  ArrowRight,
  Info,
  Archive,
  BarChart3
} from "lucide-react";

// Import actual barcode components
import { BarcodeGenerator } from "../../components/barcode/BarcodeGenerator";
import { BarcodeList } from "../../components/barcode/BarcodeList";
import { WarrantyRegister } from "../../components/barcode/WarrantyRegister";
import { enhancedApiClient } from "../../lib/security/enhanced-api-client";
import { SecureTokenManager } from "../../lib/security/secure-token-manager";
import { productService } from "../../services/product";
import type { ProductWithVariants } from "../../shared/types/product-management";

type WarrantyStatus = "active" | "expired" | "claimed" | "processing" | "repaired" | "replaced" | "denied";
type ClaimStatus = "pending" | "validated" | "in_repair" | "repaired" | "shipped" | "completed" | "rejected";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  warrantyPeriod: number; // months
  price: number;
};

type WarrantyBarcode = {
  id: string;
  productId: string;
  barcodeNumber: string;
  qrCodeData: string;
  purchaseDate?: string;
  customerId?: string;
  status: WarrantyStatus;
  expiryDate?: string;
  isUsed: boolean;
  generatedAt: string;
  printedAt?: string;
  activatedAt?: string;
};

type WarrantyClaim = {
  id: string;
  barcodeId: string;
  claimNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productId: string;
  productName: string;
  issueDescription: string;
  issueCategory: string;
  purchaseDate: string;
  claimDate: string;
  status: ClaimStatus;
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
  repairNotes?: string;
  estimatedRepairTime?: number;
  shippingTrackingNumber?: string;
  photos?: string[];
  attachments?: string[];
};

type WarrantyClaimsApiResponse = {
  data?: WarrantyClaim[];
  items?: WarrantyClaim[];
  page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
};

// Mock data for demonstration
const mockProducts: Product[] = [
  { id: "prod1", name: "Rexus Gaming Mouse RX-110", sku: "RX110", category: "Gaming Peripherals", warrantyPeriod: 12, price: 250000 },
  { id: "prod2", name: "Rexus Gaming Keyboard KX-200", sku: "KX200", category: "Gaming Peripherals", warrantyPeriod: 24, price: 450000 },
  { id: "prod3", name: "Rexus Gaming Headset HX-300", sku: "HX300", category: "Gaming Peripherals", warrantyPeriod: 18, price: 350000 },
];

const mockWarrantyBarcodes: WarrantyBarcode[] = [
  {
    id: "bc001",
    productId: "prod1",
    barcodeNumber: "WB240801001",
    qrCodeData: "https://warranty.rexus.id/claim/WB240801001",
    status: "active",
    isUsed: false,
    generatedAt: "2024-08-01T10:00:00Z",
    expiryDate: "2025-08-01"
  },
  {
    id: "bc002",
    productId: "prod2",
    barcodeNumber: "WB240801002",
    qrCodeData: "https://warranty.rexus.id/claim/WB240801002",
    status: "active",
    isUsed: true,
    generatedAt: "2024-08-01T10:30:00Z",
    purchaseDate: "2024-08-05",
    customerId: "cust001",
    activatedAt: "2024-08-05T14:20:00Z",
    expiryDate: "2026-08-05"
  }
];

const mockWarrantyClaims: WarrantyClaim[] = [
  {
    id: "claim001",
    barcodeId: "bc002",
    claimNumber: "WC-2024-08-001",
    customerId: "cust001",
    customerName: "Ahmad Rizki",
    customerEmail: "ahmad.rizki@example.com",
    customerPhone: "+62812345678",
    productId: "prod2",
    productName: "Rexus Gaming Keyboard KX-200",
    issueDescription: "Some keys are not responding properly",
    issueCategory: "Hardware Malfunction",
    purchaseDate: "2024-08-05",
    claimDate: "2024-08-10",
    status: "pending",
    photos: ["keyboard_issue.jpg"],
    attachments: ["purchase_receipt.pdf"]
  },
  {
    id: "claim002",
    barcodeId: "bc003",
    claimNumber: "WC-2024-08-002",
    customerId: "cust002",
    customerName: "John Doe",
    customerEmail: "john.doe@example.com",
    customerPhone: "+62823456789",
    productId: "prod1",
    productName: "Rexus Gaming Mouse RX-110",
    issueDescription: "Mouse sensor not tracking correctly on mousepad",
    issueCategory: "Performance Issue",
    purchaseDate: "2024-07-15",
    claimDate: "2024-08-09",
    status: "in_repair",
    validatedBy: "admin001",
    validatedAt: "2024-08-09",
    repairNotes: "Sensor cleaning and calibration required",
    estimatedRepairTime: 3,
    photos: ["sensor_issue.jpg"],
    attachments: ["purchase_receipt.pdf"]
  }
];

export default function WarrantyProgram() {
  const [activeTab, setActiveTab] = useState("overview");
  const [products] = useState<Product[]>(mockProducts);
  const [warrantyBarcodes] = useState<WarrantyBarcode[]>(mockWarrantyBarcodes);
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>(mockWarrantyClaims);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Claims API state
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState<string | null>(null);
  const [claimsPage, setClaimsPage] = useState(1);
  const [claimsMeta, setClaimsMeta] = useState({
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0
  });
  const [validatingClaims, setValidatingClaims] = useState(new Set<string>());
  
  // Dialog states
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  // Product details state for dialog
  const [productDetails, setProductDetails] = useState<ProductWithVariants | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  
  // Form states
  const [shippingForm, setShippingForm] = useState({
    trackingNumber: "",
    shippingProvider: "",
    estimatedDelivery: "",
    notes: ""
  });

  // Add validation form states
  const [approvalForm, setApprovalForm] = useState({
    notes: "",
    estimatedCompletion: ""
  });
  const [rejectionForm, setRejectionForm] = useState({
    notes: "",
    reason: ""
  });

  // Test function for debugging API calls
  const testApiCall = async () => {
    console.log('🧪 Testing API call manually...');
    
    // Check authentication status first
    console.log('🔍 Checking authentication status...');
    const authStatus = await enhancedApiClient.getAuthStatus();
    console.log('🔐 Auth Status:', authStatus);
    
    const isAuth = await enhancedApiClient.isAuthenticated();
    console.log('🔐 Is Authenticated:', isAuth);
    
    // Check token manager status
    const accessToken = SecureTokenManager.getAccessToken();
    const tokenManagerStatus = {
      isSecureMode: SecureTokenManager.isSecureMode(),
      isAuthenticated: SecureTokenManager.isAuthenticated(),
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      isTokenExpired: SecureTokenManager.isTokenExpired()
    };
    console.log('🔑 Token Manager Status:', tokenManagerStatus);
    
    alert(`Auth Status: ${JSON.stringify(authStatus, null, 2)}\n\nToken Manager: ${JSON.stringify(tokenManagerStatus, null, 2)}`);
    
    // Test 1: Using enhancedApiClient (like /users/me)
    console.log('🔍 Test 1: Using enhancedApiClient...');
    try {
      const result = await enhancedApiClient.getClient().get({
        url: '/api/v1/admin/warranty/claims?page=1&page_size=10'
      });
      console.log('✅ Enhanced API client call successful:', result);
      alert('Enhanced API call successful! Check console for details.');
    } catch (error) {
      console.error('❌ Enhanced API client call failed:', error);
      alert(`Enhanced API call failed: ${error}`);
    }
    
    // Test 2: Using our updated fetchWarrantyClaims function
    console.log('🔍 Test 2: Using updated fetchWarrantyClaims...');
    try {
      const result = await fetchWarrantyClaims(1, '', 'all');
      console.log('✅ fetchWarrantyClaims call successful:', result);
      alert('fetchWarrantyClaims successful! Check console for details.');
    } catch (error) {
      console.error('❌ fetchWarrantyClaims call failed:', error);
      alert(`fetchWarrantyClaims failed: ${error}`);
    }
    
    // Test 3: Compare with working /users/me endpoint
    console.log('🔍 Test 3: Testing /users/me for comparison...');
    try {
      const result = await enhancedApiClient.getClient().get({
        url: '/api/v1/users/me'
      });
      console.log('✅ /users/me call successful:', result);
      alert('/users/me call successful! Check console for details.');
    } catch (error) {
      console.error('❌ /users/me call failed:', error);
      alert(`/users/me call failed: ${error}`);
    }
  };

  // useEffect hooks for claims API
  useEffect(() => {
    if (activeTab === 'claims') {
      console.log('Claims tab activated, loading claims...');
      loadClaims();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'claims') {
      console.log('Search or filter changed, reloading claims...', { searchTerm, statusFilter });
      setClaimsPage(1); // Reset to first page when search/filter changes
      loadClaims();
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (activeTab === 'claims') {
      console.log('Page changed, loading claims...', { claimsPage });
      loadClaims();
    }
  }, [claimsPage]);

  // Add types for barcode lookup response
  type ApiResponse<T> = { success?: boolean; data?: T; message?: string };
  type BarcodeDetails = { product_id?: string; product_name?: string; product_sku?: string };

  // Fetch product details when claim dialog opens
  useEffect(() => {
    let cancelled = false;

    const fetchProductDetailsForClaim = async () => {
      if (!isClaimDialogOpen || !selectedClaim) return;
      setProductLoading(true);
      setProductError(null);
      setProductDetails(null);

      try {
        let pid = selectedClaim.productId?.trim();
        if (!pid) {
          try {
            const response = await enhancedApiClient.getClient().get({
              url: `/api/v1/admin/warranty/barcodes/${selectedClaim.barcodeId}`
            });
            const root = response.data as ApiResponse<BarcodeDetails>;
            pid = root?.data?.product_id || '';
          } catch (e) {
            // Keep going; we'll surface a generic error below if pid remains empty
          }
        }

        if (!pid) {
          throw new Error('Product ID not available for this claim');
        }

        const product = await productService.getProductWithDetails(pid, ['variants', 'category', 'images']);
        if (!cancelled) {
          setProductDetails(product);
        }
      } catch (err) {
        const e = err as { message?: string; response?: { data?: { message?: string } } };
        const msg = e?.response?.data?.message || e?.message || 'Failed to load product details';
        if (!cancelled) {
          setProductError(msg);
        }
      } finally {
        if (!cancelled) {
          setProductLoading(false);
        }
      }
    };

    fetchProductDetailsForClaim();

    return () => { cancelled = true; };
  }, [isClaimDialogOpen, selectedClaim]);

  // Reset product details when dialog closes
  useEffect(() => {
    if (!isClaimDialogOpen) {
      setProductDetails(null);
      setProductError(null);
      setProductLoading(false);
    }
  }, [isClaimDialogOpen]);

  // API functions
  // Normalize admin claims list response into local types
  type AdminWarrantyClaimDTO = {
    id: string;
    claim_number: string;
    barcode_id: string;
    product_id?: string;
    product_name?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    status?: string;
    issue_category?: string;
    issue_description?: string;
    created_at?: string;
  };

  type ClaimsListNormalized = {
    claims: WarrantyClaim[];
    meta: { page: number; page_size: number; total: number; total_pages: number };
  };
  
  // Add typed envelopes to avoid any
  type PaginationEnvelope = {
    current_page?: number;
    page?: number;
    page_size?: number;
    total_items?: number;
    total?: number;
    total_pages?: number;
  };
  type AdminClaimsEnvelope = {
    data?: {
      claims?: AdminWarrantyClaimDTO[];
      items?: AdminWarrantyClaimDTO[];
      pagination?: PaginationEnvelope;
    };
    items?: AdminWarrantyClaimDTO[];
    pagination?: PaginationEnvelope;
  };

  const mapStatus = (s?: string): ClaimStatus => {
    if (!s) return 'pending';
    switch (s) {
      case 'pending':
      case 'validated':
      case 'completed':
      case 'rejected':
      case 'shipped':
      case 'repaired':
        return s as ClaimStatus;
      case 'in_progress':
        return 'in_repair';
      case 'cancelled':
        return 'rejected';
      default:
        return 'pending';
    }
  };

  const mapAdminClaimToLocal = (dto: AdminWarrantyClaimDTO): WarrantyClaim => {
    return {
      id: dto.id,
      barcodeId: dto.barcode_id,
      claimNumber: dto.claim_number,
      customerId: '', // not provided in DTO
      customerName: dto.customer_name || '',
      customerEmail: dto.customer_email || '',
      customerPhone: dto.customer_phone || '',
      productId: dto.product_id || '',
      productName: dto.product_name || '',
      issueDescription: dto.issue_description || '',
      issueCategory: dto.issue_category || '',
      purchaseDate: '', // not provided in DTO
      claimDate: dto.created_at || new Date().toISOString(),
      status: mapStatus(dto.status),
      validatedBy: undefined,
      validatedAt: undefined,
      rejectionReason: undefined,
      repairNotes: undefined,
      estimatedRepairTime: undefined,
      shippingTrackingNumber: undefined,
      photos: [],
      attachments: [],
    };
  };

  const normalizeClaimsResponse = (resp: AdminClaimsEnvelope): ClaimsListNormalized => {
    const items = resp?.data?.claims ?? resp?.data?.items ?? resp?.items ?? resp?.data ?? [];
    const claims = Array.isArray(items) ? items.map(mapAdminClaimToLocal) : [];
    const p = resp?.data?.pagination ?? resp?.pagination ?? {};
    const page = Number(p?.current_page ?? p?.page ?? 1);
    const page_size = Number(p?.page_size ?? 10);
    const total = Number(p?.total_items ?? p?.total ?? claims.length);
    const total_pages = Number(p?.total_pages ?? Math.ceil(total / page_size));
    return { claims, meta: { page, page_size, total, total_pages } };
  };

  const fetchWarrantyClaims = async (page = 1, search = '', status = 'all'): Promise<ClaimsListNormalized> => {
    try {
      console.log('Fetching warranty claims...', { page, search, status });
      
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10'
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      if (status !== 'all') {
        params.append('status', status);
      }
      
      const response = await enhancedApiClient.getClient().get({
        url: `/api/v1/admin/warranty/claims?${params}`
      });
      console.log('API Response:', response);
      
      return normalizeClaimsResponse(response.data);
    } catch (error) {
      console.error('Error fetching warranty claims:', error);
      throw error;
    }
  };

  const loadClaims = async () => {
    setClaimsLoading(true);
    setClaimsError(null);
    
    try {
      const { claims, meta } = await fetchWarrantyClaims(claimsPage, searchTerm, statusFilter);
      setWarrantyClaims(Array.isArray(claims) ? claims : []);
      setClaimsMeta(meta);
    } catch (error) {
      setClaimsError(error instanceof Error ? error.message : 'Failed to load warranty claims');
      setWarrantyClaims([]);
    } finally {
      setClaimsLoading(false);
    }
  };

  // Helper functions
  const getStatusBadge = (status: ClaimStatus) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      validated: { label: "Validated", variant: "default" as const },
      in_repair: { label: "In Repair", variant: "default" as const },
      repaired: { label: "Repaired", variant: "default" as const },
      shipped: { label: "Shipped", variant: "default" as const },
      completed: { label: "Completed", variant: "default" as const },
      rejected: { label: "Rejected", variant: "destructive" as const }
    };
    
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const validateClaim = async (
    claimId: string,
    isValid: boolean,
    rejectionReason?: string,
    notes?: string,
    estimatedCompletionDate?: string
  ) => {
    setValidatingClaims(prev => new Set(prev).add(claimId));
    
    try {
      const isoEstimate = estimatedCompletionDate
        ? new Date(estimatedCompletionDate).toISOString().replace(/\.\d{3}Z$/, 'Z')
        : undefined;

      const payload = isValid
        ? {
            action: 'validate',
            notes: notes || 'Approved via admin UI',
            ...(isoEstimate ? { estimated_completion_date: isoEstimate } : {})
          }
        : {
            action: 'reject',
            notes: notes || 'Rejected via admin UI',
            rejection_reason: rejectionReason || 'No reason provided'
          };

      const response = await enhancedApiClient.getClient().post({
        url: `/api/v1/admin/warranty/claims/${claimId}/validate`,
        body: payload
      });
      
      // Reload claims after validation
      await loadClaims();
      
      // Close dialog if it's open
      setIsClaimDialogOpen(false);
      
      console.log(`Claim ${isValid ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error validating claim:', error);
      console.error(error instanceof Error ? error.message : 'Failed to validate claim');
    } finally {
      setValidatingClaims(prev => {
        const newSet = new Set(prev);
        newSet.delete(claimId);
        return newSet;
      });
    }
  };

  const updateClaimStatus = (claimId: string, newStatus: ClaimStatus) => {
    setWarrantyClaims(prev => prev.map(claim => 
      claim.id === claimId ? { ...claim, status: newStatus } : claim
    ));
    setIsClaimDialogOpen(false);
  };

  const shipProduct = () => {
    if (selectedClaim && shippingForm.trackingNumber && shippingForm.shippingProvider) {
      setWarrantyClaims(prev => prev.map(claim => 
        claim.id === selectedClaim.id 
          ? { 
              ...claim, 
              status: "shipped",
              shippingTrackingNumber: shippingForm.trackingNumber
            }
          : claim
      ));
      setIsShippingDialogOpen(false);
      setIsClaimDialogOpen(false);
      setShippingForm({ trackingNumber: "", shippingProvider: "", estimatedDelivery: "", notes: "" });
    }
  };

  // Filter claims based on search and status
  const claimsArray = Array.isArray(warrantyClaims) ? warrantyClaims : [];
  const filteredClaims = claimsArray.filter((claim) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      claim.claimNumber.toLowerCase().includes(q) ||
      claim.customerName.toLowerCase().includes(q) ||
      claim.productName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalBarcodes = warrantyBarcodes.length;
  const activeBarcodes = warrantyBarcodes.filter((b) => b.status === "active").length;
  const usedBarcodes = warrantyBarcodes.filter((b) => b.isUsed).length;
  const totalClaims = claimsArray.length;
  const pendingClaims = claimsArray.filter((c) => c.status === "pending").length;
  const completedClaims = claimsArray.filter((c) => c.status === "completed").length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Warranty Program Management</h1>
          <p className="text-gray-600 mt-1">Manage warranty barcodes, claims, and customer support</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={testApiCall} className="flex items-center gap-2 bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100">
            <Settings className="h-4 w-4" />
            Test API
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Warranty Batch
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="list">Barcode List</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Barcodes</p>
                  <p className="text-2xl font-bold">{totalBarcodes}</p>
                </div>
                <QrCode className="h-8 w-8 text-blue-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Warranties</p>
                  <p className="text-2xl font-bold">{activeBarcodes}</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Used Barcodes</p>
                  <p className="text-2xl font-bold">{usedBarcodes}</p>
                </div>
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Claims</p>
                  <p className="text-2xl font-bold">{pendingClaims}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>
          </div>

          {/* Recent Claims */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Warranty Claims</h2>
              <Button variant="outline" size="sm">View All</Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warrantyClaims.slice(0, 5).map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                      <TableCell>{claim.customerName}</TableCell>
                      <TableCell>{claim.productName}</TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell>{formatDate(claim.claimDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Generate Tab - Using actual BarcodeGenerator component */}
        <TabsContent value="generate">
          <BarcodeGenerator />
        </TabsContent>

        {/* Barcode List Tab - Using actual BarcodeList component */}
        <TabsContent value="list">
          <BarcodeList />
        </TabsContent>

        {/* Hidden: Validate and Analytics tabs removed per request */}

        {/* Warranty Register Tab - Using actual WarrantyRegister component */}
        <TabsContent value="register">
          <WarrantyRegister />
        </TabsContent>

        {/* Hidden: API Debug tab removed per request */}

        {/* Claims Management Tab */}
        <TabsContent value="claims" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Warranty Claims Management</h2>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadClaims()}
                  disabled={claimsLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${claimsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search claims..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    disabled={claimsLoading}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter} disabled={claimsLoading}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="in_repair">In Repair</SelectItem>
                    <SelectItem value="repaired">Repaired</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error Alert */}
            {claimsError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error loading claims</AlertTitle>
                <AlertDescription>
                  {claimsError}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadClaims()}
                    className="ml-2"
                  >
                    Try Again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {claimsLoading && !claimsError && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Loading warranty claims...</span>
                </div>
              </div>
            )}

            {/* Claims Table */}
            {!claimsLoading && !claimsError && (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Claim Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Claim Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warrantyClaims.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2">
                              <AlertCircle className="h-8 w-8 text-gray-400" />
                              <span className="text-gray-500">No warranty claims found</span>
                              {(searchTerm || statusFilter !== 'all') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                  }}
                                >
                                  Clear filters
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        warrantyClaims.map((claim) => (
                          <TableRow key={claim.id}>
                            <TableCell>
                              <div className="font-medium">{claim.claimNumber}</div>
                              <div className="text-sm text-gray-500">{claim.barcodeId}</div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{claim.customerName}</div>
                                <div className="text-sm text-gray-500">{claim.customerEmail}</div>
                                <div className="text-sm text-gray-500">{claim.customerPhone}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{claim.productName}</div>
                                <div className="text-sm text-gray-500">
                                  Purchased: {formatDate(claim.purchaseDate)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{claim.issueCategory}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {claim.issueDescription}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(claim.status)}</TableCell>
                            <TableCell>{formatDate(claim.claimDate)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedClaim(claim);
                                    setIsClaimDialogOpen(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {claim.status === "pending" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => validateClaim(claim.id, true)}
                                      disabled={validatingClaims.has(claim.id)}
                                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                    >
                                      {validatingClaims.has(claim.id) ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => validateClaim(claim.id, false, "Invalid warranty claim")}
                                      disabled={validatingClaims.has(claim.id)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      {validatingClaims.has(claim.id) ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {claimsMeta.total > 0 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Showing {((claimsMeta.page - 1) * claimsMeta.page_size) + 1} to{' '}
                      {Math.min(claimsMeta.page * claimsMeta.page_size, claimsMeta.total)} of{' '}
                      {claimsMeta.total} claims
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClaimsPage(prev => Math.max(1, prev - 1))}
                        disabled={claimsPage <= 1 || claimsLoading}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {claimsMeta.page} of {claimsMeta.total_pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClaimsPage(prev => Math.min(claimsMeta.total_pages, prev + 1))}
                        disabled={claimsPage >= claimsMeta.total_pages || claimsLoading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Claim Details Dialog */}
      <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Warranty Claim Details</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-6">
              {/* Claim Header */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Claim Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Claim Number:</span>
                      <span className="font-medium">{selectedClaim.claimNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      {getStatusBadge(selectedClaim.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Claim Date:</span>
                      <span className="font-medium">{formatDate(selectedClaim.claimDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Category:</span>
                      <span className="font-medium">{selectedClaim.issueCategory}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedClaim.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedClaim.customerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedClaim.customerPhone}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Product & Issue Details */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product & Issue Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Product:</Label>
                    <div className="font-medium">{productDetails?.name ?? selectedClaim.productName}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Purchase Date:</Label>
                    <div className="font-medium">{formatDate(selectedClaim.purchaseDate)}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-sm text-gray-600">Issue Description:</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedClaim.issueDescription}
                  </div>
                </div>
                {/* Product Details from API */}
                <div className="mt-4">
                  {productLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading product details...
                    </div>
                  )}
                  {!productLoading && productError && (
                    <Alert variant="destructive">
                      <AlertDescription>{productError}</AlertDescription>
                    </Alert>
                  )}
                  {!productLoading && !productError && productDetails && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Product ID:</Label>
                          <div className="font-mono text-xs">{productDetails.id}</div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">SKU:</Label>
                          <div className="font-medium">{productDetails.sku}</div>
                        </div>
                      </div>
                      {Array.isArray(productDetails.variants) && productDetails.variants.length > 0 && (
                        <div>
                          <Label className="text-sm text-gray-600">Variants:</Label>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {productDetails.variants.map((v) => (
                              <div key={v.id} className="p-2 bg-gray-50 rounded">
                                <div className="text-sm font-medium">{v.sku}</div>
                                {Object.keys(v.variant_options ?? {}).length > 0 && (
                                  <div className="text-xs text-gray-600">
                                    {Object.entries(v.variant_options ?? {}).map(([name, value]) => `${name}: ${value}`).join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Status Management */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Status Management
                </h3>
                <div className="space-y-4">
                  {selectedClaim.status === "pending" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Approval Section */}
                      <div className="space-y-2">
                        <Label htmlFor="approvalNotes">Approval Notes</Label>
                        <Textarea
                          id="approvalNotes"
                          placeholder="Add approval notes..."
                          value={approvalForm.notes}
                          onChange={(e) => setApprovalForm(prev => ({ ...prev, notes: e.target.value }))}
                        />
                        <Label htmlFor="estimatedCompletion">Estimated Completion Date</Label>
                        <Input
                          id="estimatedCompletion"
                          type="datetime-local"
                          value={approvalForm.estimatedCompletion}
                          onChange={(e) => setApprovalForm(prev => ({ ...prev, estimatedCompletion: e.target.value }))}
                        />
                        <Button
                          onClick={() =>
                            validateClaim(
                              selectedClaim.id,
                              true,
                              undefined,
                              approvalForm.notes,
                              approvalForm.estimatedCompletion
                            )
                          }
                          className="mt-2 flex items-center gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Validate Claim
                        </Button>
                      </div>

                      {/* Rejection Section */}
                      <div className="space-y-2">
                        <Label htmlFor="rejectionNotes">Rejection Notes</Label>
                        <Textarea
                          id="rejectionNotes"
                          placeholder="Add rejection notes..."
                          value={rejectionForm.notes}
                          onChange={(e) => setRejectionForm(prev => ({ ...prev, notes: e.target.value }))}
                        />
                        <Label htmlFor="rejectionReason">Rejection Reason</Label>
                        <Input
                          id="rejectionReason"
                          placeholder="Enter rejection reason..."
                          value={rejectionForm.reason}
                          onChange={(e) => setRejectionForm(prev => ({ ...prev, reason: e.target.value }))}
                        />
                        <Button
                          variant="destructive"
                          onClick={() =>
                            validateClaim(
                              selectedClaim.id,
                              false,
                              rejectionForm.reason,
                              rejectionForm.notes
                            )
                          }
                          className="mt-2 flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Reject Claim
                        </Button>
                      </div>
                    </div>
                  )}

                {selectedClaim.status === "validated" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => updateClaimStatus(selectedClaim.id, "in_repair")}
                      className="flex items-center gap-2"
                    >
                      <Wrench className="h-4 w-4" />
                      Start Repair
                    </Button>
                  </div>
                )}

                {selectedClaim.status === "in_repair" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => updateClaimStatus(selectedClaim.id, "repaired")}
                      className="flex items-center gap-2"
                    >
                      <CheckSquare className="h-4 w-4" />
                      Mark as Repaired
                    </Button>
                  </div>
                )}

                {selectedClaim.status === "repaired" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setIsShippingDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Ship Back to Customer
                    </Button>
                  </div>
                )}

                {selectedClaim.status === "shipped" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => updateClaimStatus(selectedClaim.id, "completed")}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark as Completed
                    </Button>
                  </div>
                )}
                </div>

                {/* Repair Notes */}
                {(selectedClaim.status === "in_repair" || selectedClaim.status === "repaired") && (
                  <div className="mt-4">
                    <Label htmlFor="repairNotes">Repair Notes</Label>
                    <Textarea
                      id="repairNotes"
                      placeholder="Add repair notes..."
                      defaultValue={selectedClaim.repairNotes}
                      className="mt-1"
                    />
                  </div>
                )}
              </Card>

              {/* Shipping Info */}
              {selectedClaim.shippingTrackingNumber && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number:</span>
                      <span className="font-medium">{selectedClaim.shippingTrackingNumber}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shipping Dialog */}
      <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ship Product Back</DialogTitle>
            <DialogDescription>
              Enter shipping details to send the repaired product back to customer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                value={shippingForm.trackingNumber}
                onChange={(e) => setShippingForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                placeholder="Enter tracking number"
              />
            </div>

            <div>
              <Label htmlFor="shippingProvider">Shipping Provider</Label>
              <Select 
                value={shippingForm.shippingProvider} 
                onValueChange={(value) => setShippingForm(prev => ({ ...prev, shippingProvider: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jne">JNE</SelectItem>
                  <SelectItem value="pos">Pos Indonesia</SelectItem>
                  <SelectItem value="tiki">TIKI</SelectItem>
                  <SelectItem value="sicepat">SiCepat</SelectItem>
                  <SelectItem value="jnt">J&T Express</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={shippingForm.estimatedDelivery}
                onChange={(e) => setShippingForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="shippingNotes">Notes (Optional)</Label>
              <Textarea
                id="shippingNotes"
                value={shippingForm.notes}
                onChange={(e) => setShippingForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional shipping notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShippingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={shipProduct}>
              Ship Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}