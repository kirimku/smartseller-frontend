import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  QrCode, 
  List, 
  BarChart3, 
  Search, 
  Plus,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

// Import barcode components
import { BarcodeGenerator } from '../components/barcode/BarcodeGenerator';
import { BarcodeList } from '../components/barcode/BarcodeList';
import { BarcodeStatsDashboard } from '../components/barcode/BarcodeStatsDashboard';
import { BarcodeValidator } from '../components/barcode/BarcodeValidator';
import { BarcodeDetailsModal } from '../components/barcode/BarcodeDetailsModal';

interface Barcode {
  id: string;
  barcode: string;
  product_id: string;
  product_name: string;
  batch_id: string;
  batch_name: string;
  status: 'active' | 'used' | 'expired' | 'revoked';
  created_at: string;
  expires_at: string;
  used_at?: string;
  customer_id?: string;
  warranty_claim_id?: string;
}

const BarcodeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBarcodeId, setSelectedBarcodeId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleViewBarcodeDetails = (barcode: Barcode) => {
    setSelectedBarcodeId(barcode.id);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedBarcodeId(null);
    setIsDetailsModalOpen(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Barcode Management</h1>
          <p className="text-muted-foreground">
            Generate, manage, and track warranty barcodes for your products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            Warranty System
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1">
          <TabsTrigger value="overview" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Plus className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Generate</span>
            <span className="sm:hidden">New</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <List className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Manage</span>
            <span className="sm:hidden">List</span>
          </TabsTrigger>
          <TabsTrigger value="validate" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Search className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Validate</span>
            <span className="sm:hidden">Check</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            {/* Quick Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Generated</CardTitle>
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12,345</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Barcodes</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8,234</div>
                  <p className="text-xs text-muted-foreground">
                    66.7% of total generated
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Used This Month</CardTitle>
                  <Package className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    +12.5% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">
                    Within next 30 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common barcode management tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div 
                    className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setActiveTab('generate')}
                  >
                    <Plus className="h-8 w-8 text-blue-600 mb-2" />
                    <h3 className="font-medium">Generate Barcodes</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Create new warranty barcodes
                    </p>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setActiveTab('validate')}
                  >
                    <Search className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-medium">Validate Barcode</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Check barcode status
                    </p>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setActiveTab('list')}
                  >
                    <List className="h-8 w-8 text-purple-600 mb-2" />
                    <h3 className="font-medium">Manage Barcodes</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      View and manage all barcodes
                    </p>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                    <h3 className="font-medium">View Analytics</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Detailed statistics and reports
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest barcode generation and usage activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Generated 50 barcodes for Gaming Headset Pro</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Barcode WB-2024-001234 was used for warranty claim</p>
                      <p className="text-xs text-muted-foreground">4 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">25 barcodes will expire in 7 days</p>
                      <p className="text-xs text-muted-foreground">6 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Exported 100 barcodes for Wireless Mouse batch</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Generate Warranty Barcodes
              </CardTitle>
              <CardDescription>
                Create new warranty barcodes for your products. Select a product, specify quantity, and configure warranty settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarcodeGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        {/* List/Manage Tab */}
        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Barcode Management
              </CardTitle>
              <CardDescription>
                View, search, filter, and manage all generated warranty barcodes. Export data or perform batch operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarcodeList onViewDetails={handleViewBarcodeDetails} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validate Tab */}
        <TabsContent value="validate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Barcode Validation
              </CardTitle>
              <CardDescription>
                Validate warranty barcodes to check their status, authenticity, and associated product information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarcodeValidator />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <BarcodeStatsDashboard />
        </TabsContent>
      </Tabs>

      {/* Barcode Details Modal */}
      <BarcodeDetailsModal
        barcodeId={selectedBarcodeId}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
};

export default BarcodeManagement;