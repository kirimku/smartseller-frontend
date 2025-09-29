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
import { BarcodeValidator } from "../../components/barcode/BarcodeValidator";
import { BarcodeStatsDashboard } from "../../components/barcode/BarcodeStatsDashboard";

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
  
  // Dialog states
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  
  // Form states
  const [shippingForm, setShippingForm] = useState({
    trackingNumber: "",
    shippingProvider: "",
    estimatedDelivery: "",
    notes: ""
  });

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

  const validateClaim = (claimId: string, isValid: boolean, rejectionReason?: string) => {
    setWarrantyClaims(prev => prev.map(claim => 
      claim.id === claimId 
        ? { 
            ...claim, 
            status: isValid ? "validated" : "rejected",
            validatedBy: "admin001",
            validatedAt: new Date().toISOString(),
            rejectionReason: rejectionReason
          }
        : claim
    ));
    setIsClaimDialogOpen(false);
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
  const filteredClaims = warrantyClaims.filter(claim => {
    const matchesSearch = claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalBarcodes = warrantyBarcodes.length;
  const activeBarcodes = warrantyBarcodes.filter(b => b.status === "active").length;
  const usedBarcodes = warrantyBarcodes.filter(b => b.isUsed).length;
  const totalClaims = warrantyClaims.length;
  const pendingClaims = warrantyClaims.filter(c => c.status === "pending").length;
  const completedClaims = warrantyClaims.filter(c => c.status === "completed").length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Warranty Program Management</h1>
          <p className="text-gray-600 mt-1">Manage warranty barcodes, claims, and customer support</p>
        </div>
        <div className="flex gap-3">
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="list">Barcode List</TabsTrigger>
          <TabsTrigger value="validate">Validate</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
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

        {/* Validate Tab - Using actual BarcodeValidator component */}
        <TabsContent value="validate">
          <BarcodeValidator />
        </TabsContent>

        {/* Analytics Tab - Using actual BarcodeStatsDashboard component */}
        <TabsContent value="analytics">
          <BarcodeStatsDashboard />
        </TabsContent>

        {/* Claims Management Tab */}
        <TabsContent value="claims" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Warranty Claims Management</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search claims..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  {filteredClaims.map((claim) => (
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
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => validateClaim(claim.id, false, "Invalid warranty claim")}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
                    <div className="font-medium">{selectedClaim.productName}</div>
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
              </Card>

              {/* Status Management */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Status Management
                </h3>
                <div className="space-y-4">
                  {selectedClaim.status === "pending" && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => validateClaim(selectedClaim.id, true)}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Validate Claim
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => validateClaim(selectedClaim.id, false, "Invalid warranty claim")}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Reject Claim
                      </Button>
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