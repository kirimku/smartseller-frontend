import React, { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Alert, AlertDescription } from '../../../shared/components/ui/alert';
import { Loader2, Store, Eye, EyeOff, Crown } from 'lucide-react';

export const TenantAdminLogin: React.FC = () => {
  const [email, setEmail] = useState('admin@gaming-pro.com');
  const [password, setPassword] = useState('tenant123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated, hasRole, loading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already authenticated as tenant admin
  if (isAuthenticated && hasRole('tenant_admin')) {
    const redirectTo = searchParams.get('redirect') || '/admin/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  // Redirect if authenticated but wrong role
  if (isAuthenticated && !hasRole('tenant_admin')) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    clearError();

    try {
      await login(email, password);
      const redirectTo = searchParams.get('redirect') || '/admin/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Store className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Store Admin Login</CardTitle>
          <CardDescription>
            Sign in to manage your store and business
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || authError) && (
              <Alert variant="destructive">
                <AlertDescription>{error || authError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourstore.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={isLoading || loading}
            >
              {(isLoading || loading) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Sign in to Admin
                </>
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-orange-50 rounded-lg">
            <h3 className="text-sm font-medium text-orange-900 mb-2">Demo Credentials</h3>
            <div className="text-sm text-orange-700 space-y-1">
              <p><strong>Email:</strong> admin@gaming-pro.com</p>
              <p><strong>Password:</strong> tenant123</p>
              <p className="text-xs text-orange-600 mt-2">
                This will log you into the Gaming Pro store admin
              </p>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Don't have a store yet?</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/signup')}
                className="w-full"
              >
                Create Your Store
              </Button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Are you a customer?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-orange-600 hover:underline"
              >
                Customer login
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};