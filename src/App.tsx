import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@shared/components/ui/toaster";
import { Toaster as Sonner } from "@shared/components/ui/sonner";
import { TooltipProvider } from "@shared/components/ui/tooltip";
import PWAInstallPrompt from "@shared/components/common/PWAInstallPrompt";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";

// Platform Pages
import { PlatformLanding } from "./platform/pages/PlatformLanding";
import { PlatformDashboard } from "./platform/pages/PlatformDashboard";

// Authentication Pages
import { PlatformLogin } from "./platform/pages/Login";

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
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<PlatformLanding />} />
                <Route path="/login" element={<PlatformLogin />} />
                <Route path="/dashboard" element={<PlatformDashboard />} />
                <Route path="/demo" element={<ErrorHandlingDemo />} />
                <Route path="/platform" element={<Navigate to="/" replace />} />
                <Route path="/platform/login" element={<Navigate to="/login" replace />} />
                <Route path="/platform/dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

export default App;
