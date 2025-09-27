import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@shared/components/ui/toaster";
import { Toaster as Sonner } from "@shared/components/ui/sonner";
import { TooltipProvider } from "@shared/components/ui/tooltip";
import PWAInstallPrompt from "@shared/components/common/PWAInstallPrompt";

// Domain Detection
import { 
  detectAppMode, 
  detectTenantSlug, 
  updateDocumentMetadata, 
  debugDomainDetection,
  type AppMode 
} from "./utils/domain-detector";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { TenantProvider } from "./contexts/TenantContext";

// Route Guards
import { CustomerGuard } from "./shared/components/RouteGuard";

// Authentication Pages
import { PlatformLogin } from "./platform/pages/Login";
import { TenantAdminLogin } from "./tenant/admin/pages/Login";
import { CustomerLogin } from "./storefront/pages/Login";

// Existing pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Warranty from "./pages/Warranty";
import Referral from "./pages/Referral";
import SpinWin from "./pages/SpinWin";
import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import CreateOrder from "./pages/CreateOrder";
import TrackingStatus from "./pages/TrackingStatus";
import MarketplaceIntegration from "./pages/MarketplaceIntegration";
import WarrantyProgram from "./pages/WarrantyProgram";
import AdminAffiliate from "./pages/AdminAffiliate";
import LoyaltyRewards from "./pages/LoyaltyRewards";
import WarehouseManagement from "./pages/WarehouseManagement";
import ProductDetail from "./pages/ProductDetail";
import RedeemPage from "./pages/RedeemPage";
import RedemptionSuccess from "./pages/RedemptionSuccess";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";

const queryClient = new QueryClient();

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Platform App Component (SmartSeller Admin)
const PlatformApp: React.FC = () => (
  <Routes>
    <Route path="/platform/login" element={<PlatformLogin />} />
    <Route path="/platform/dashboard" element={<PlatformDashboard />} />
    <Route path="/platform/*" element={<Navigate to="/platform/dashboard" replace />} />
    <Route path="/*" element={<Navigate to="/platform/dashboard" replace />} />
  </Routes>
);

// Tenant App Component (Storefront + Admin)
const TenantApp: React.FC<{ tenantSlug: string }> = ({ tenantSlug }) => (
  <TenantProvider tenantSlug={tenantSlug}>
    <Routes>
      {/* Tenant Admin Routes */}
      <Route path="/admin/login" element={<TenantAdminLogin />} />
      <Route path="/admin/dashboard" element={<TenantAdminDashboard />} />
      
      {/* Legacy admin routes - still accessible */}
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="/admin/orders/create" element={<CreateOrder />} />
      <Route path="/admin/tracking" element={<TrackingStatus />} />
      <Route path="/admin/marketplace" element={<MarketplaceIntegration />} />
      <Route path="/admin/warranty" element={<WarrantyProgram />} />
      <Route path="/admin/affiliate" element={<AdminAffiliate />} />
      <Route path="/admin/loyalty" element={<LoyaltyRewards />} />
      <Route path="/admin/warehouse" element={<WarehouseManagement />} />

      {/* Customer Authentication */}
      <Route path="/login" element={<CustomerLogin />} />

      {/* Storefront Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/warranty" element={<Warranty />} />
      <Route path="/referral" element={<Referral />} />
      <Route path="/spin-win" element={<SpinWin />} />
      <Route path="/product/:productId" element={<ProductDetail />} />
      <Route path="/redeem/:productId" element={<RedeemPage />} />
      <Route path="/redemption-success" element={<RedemptionSuccess />} />
      
      {/* Protected Customer Routes */}
      <Route 
        path="/profile" 
        element={
          <CustomerGuard>
            <Profile />
          </CustomerGuard>
        } 
      />
      <Route 
        path="/my-orders" 
        element={
          <CustomerGuard>
            <MyOrders />
          </CustomerGuard>
        } 
      />
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TenantProvider>
);

// Placeholder Dashboard Components
const PlatformDashboard: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Platform Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Platform management interface coming in Week 4...</p>
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-500">• Tenant Management</div>
          <div className="text-sm text-gray-500">• System Analytics</div>
          <div className="text-sm text-gray-500">• Platform Settings</div>
        </div>
      </div>
    </div>
  </div>
);

const TenantAdminDashboard: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Store Admin Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Store administration interface coming in Week 4...</p>
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-500">• Product Management</div>
          <div className="text-sm text-gray-500">• Order Processing</div>
          <div className="text-sm text-gray-500">• Customer Management</div>
          <div className="text-sm text-gray-500">• Analytics Dashboard</div>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Detect domain and configure app
    const mode = detectAppMode();
    const slug = detectTenantSlug();
    
    setAppMode(mode);
    setTenantSlug(slug);
    
    // Update document metadata
    updateDocumentMetadata();
    
    // Debug in development
    debugDomainDetection();
    
    setIsInitialized(true);
  }, []);

  // Show loading while detecting domain
  if (!isInitialized || !appMode) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            {appMode === 'platform' ? (
              <PlatformApp />
            ) : (
              <TenantApp tenantSlug={tenantSlug} />
            )}
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
