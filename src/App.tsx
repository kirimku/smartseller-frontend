import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "./shared/components/ui/toaster";
import { Toaster as Sonner } from "./shared/components/ui/sonner";
import { TooltipProvider } from "./shared/components/ui/tooltip";
import { Button } from "./shared/components/ui/button";
import PWAInstallPrompt from "./shared/components/common/PWAInstallPrompt";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { SessionProvider } from "./contexts/SessionContext";

// Platform Pages
import PlatformLanding from "./platform/pages/PlatformLanding";
import { PlatformDashboard } from "./platform/pages/PlatformDashboard";

// Authentication Pages
import { PlatformLogin } from "./platform/pages/Login";

// Protected Route Components
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RouteGuard } from "./components/auth/RouteGuard";
import { SessionWarnings } from "./components/auth/SessionWarnings";

// Platform admin pages only
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLayout from "./platform/pages/AdminLayout";
import AdminDashboard from "./platform/pages/AdminDashboard";
import AdminProducts from "./platform/pages/AdminProducts";
import AdminUsers from "./platform/pages/AdminUsers";
import AdminOrders from "./platform/pages/AdminOrders";
import WarrantyProgram from "./platform/pages/WarrantyProgram";
import ProductManagement from "./pages/ProductManagement";

// Error Boundary
import { ErrorBoundary } from "./components/ErrorBoundary";

// Demo Components
import { ErrorHandlingDemo } from "./components/ErrorHandlingDemo";

// Layouts
import PlatformLayout from './platform/components/PlatformLayout';

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const App: React.FC = () => {
  console.log('🚀 App loaded - PWA Update Test v2.0 - VitePWA Fixed!');
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // In production, send to error reporting service
        console.error('App Error:', error, errorInfo);
      }}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <BrowserRouter>
          <AuthProvider>
            <SessionProvider
              config={{
                timeoutMinutes: 30,
                warningMinutes: 5,
                checkIntervalSeconds: 30,
                maxConcurrentSessions: 3,
                trackActivity: true,
                autoExtendOnActivity: false,
              }}
            >
              <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PlatformLanding />} />
                <Route path="/login" element={<PlatformLogin />} />
                
                {/* Dashboard - Protected Route (renders admin content) */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <RouteGuard 
                        requiredRole="platform_admin"
                        maxConcurrentSessions={3}
                        sessionTimeoutMinutes={30}
                        onSessionTimeout={() => console.log('Session timeout')}
                        onConcurrentSessionDetected={() => console.log('Concurrent session detected')}
                        onUnauthorizedAccess={(reason) => console.log('Unauthorized access:', reason)}
                      >
                        <AdminLayout />
                      </RouteGuard>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<ProductManagement />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="warranty" element={<WarrantyProgram />} />
                </Route>
                
                {/* Demo Route - Protected for authenticated users only */}
                <Route 
                  path="/demo" 
                  element={
                    <ProtectedRoute fallbackPath="/login">
                      <ErrorHandlingDemo />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin Routes - Protected */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <RouteGuard 
                        requiredRole="platform_admin"
                        maxConcurrentSessions={3}
                        sessionTimeoutMinutes={30}
                        onSessionTimeout={() => console.log('Session timeout')}
                        onConcurrentSessionDetected={() => console.log('Concurrent session detected')}
                        onUnauthorizedAccess={(reason) => console.log('Unauthorized access:', reason)}
                      >
                        <AdminLayout />
                      </RouteGuard>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="warranty" element={<WarrantyProgram />} />
                </Route>
                
                {/* Legacy redirects */}
                <Route path="/platform" element={<Navigate to="/" replace />} />
                <Route path="/platform/login" element={<Navigate to="/login" replace />} />
                <Route path="/platform/dashboard" element={<Navigate to="/dashboard" replace />} />
                
                {/* Unauthorized access page */}
                <Route 
                  path="/unauthorized" 
                  element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                        <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                        <Button onClick={() => window.history.back()}>Go Back</Button>
                      </div>
                    </div>
                  } 
                />
                
                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </SessionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

export default App;
