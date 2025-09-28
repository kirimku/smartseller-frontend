import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@shared/components/ui/toaster";
import { Toaster as Sonner } from "@shared/components/ui/sonner";
import { TooltipProvider } from "@shared/components/ui/tooltip";
import { Button } from "@shared/components/ui/button";
import PWAInstallPrompt from "@shared/components/common/PWAInstallPrompt";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { SessionProvider } from "./contexts/SessionContext";

// Platform Pages
import { PlatformLanding } from "./platform/pages/PlatformLanding";
import { PlatformDashboard } from "./platform/pages/PlatformDashboard";

// Authentication Pages
import { PlatformLogin } from "./platform/pages/Login";

// Protected Route Components
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RouteGuard } from "./components/auth/RouteGuard";
import { SessionWarnings } from "./components/auth/SessionWarnings";

// Platform admin pages only
import NotFound from "./pages/NotFound";

// Error Boundary
import { ErrorBoundary } from "./components/ErrorBoundary";

// Demo Components
import { ErrorHandlingDemo } from "./components/ErrorHandlingDemo";

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const App: React.FC = () => {
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
              <SessionWarnings />
              <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PlatformLanding />} />
                <Route path="/login" element={<PlatformLogin />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute 
                       requiredRoles={['platform_admin', 'tenant_admin']}
                       fallbackPath="/login"
                     >
                      <RouteGuard
                        requireActiveSession={true}
                        sessionTimeoutMinutes={30}
                        maxConcurrentSessions={3}
                        onSessionTimeout={() => console.log('Session timeout detected')}
                        onConcurrentSessionDetected={() => console.log('Concurrent session detected')}
                        onUnauthorizedAccess={(reason) => console.log('Unauthorized access:', reason)}
                      >
                        <PlatformDashboard />
                      </RouteGuard>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Demo Route - Protected for authenticated users only */}
                <Route 
                  path="/demo" 
                  element={
                    <ProtectedRoute fallbackPath="/login">
                      <ErrorHandlingDemo />
                    </ProtectedRoute>
                  } 
                />
                
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
                        <p className="text-gray-600 mb-6">You don't have permission to access this resource.</p>
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
