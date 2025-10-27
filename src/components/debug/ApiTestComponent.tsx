/**
 * API Test Component
 * 
 * This component tests various API endpoints to debug authentication issues
 * and compare how different endpoints handle bearer tokens.
 */

import React, { useState } from 'react';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Badge } from '../../shared/components/ui/badge';
import { Separator } from '../../shared/components/ui/separator';
import { CheckCircle, XCircle, AlertTriangle, Loader2, User, Package, Shield } from 'lucide-react';
import { enhancedApiClient } from '../../lib/security/enhanced-api-client';
import { userProfileService } from '../../services/user-profile';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'pending' | 'success' | 'error' | 'loading';
  statusCode?: number;
  message?: string;
  headers?: Record<string, string>;
  tokenSent?: boolean;
  responseData?: unknown;
  error?: string;
  timestamp?: string;
}

export const ApiTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (endpoint: string, updates: Partial<TestResult>) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.endpoint === endpoint);
      if (existing) {
        return prev.map(r => r.endpoint === endpoint ? { ...r, ...updates } : r);
      } else {
        return [...prev, { endpoint, method: 'GET', status: 'pending', ...updates }];
      }
    });
  };

  const testUsersMe = async () => {
    const endpoint = '/api/v1/users/me';
    updateTestResult(endpoint, { status: 'loading', method: 'GET' });

    try {
      console.log('🧪 [ApiTest] Testing /users/me endpoint...');
      
      // Test with enhanced API client
      await enhancedApiClient.initialize();
      const authStatus = await enhancedApiClient.getAuthStatus();
      console.log('🧪 [ApiTest] Auth status:', authStatus);

      const response = await userProfileService.getCurrentUser();
      console.log('🧪 [ApiTest] /users/me response:', response);

      updateTestResult(endpoint, {
        status: 'success',
        statusCode: 200,
        message: 'User profile fetched successfully',
        tokenSent: authStatus.hasValidToken,
        responseData: response,
        timestamp: new Date().toISOString()
      });
    } catch (error: unknown) {
      console.error('🧪 [ApiTest] /users/me error:', error);
      const errorObj = error as { status?: number; message?: string };
      updateTestResult(endpoint, {
        status: 'error',
        statusCode: errorObj.status || 500,
        message: errorObj.message || 'Failed to fetch user profile',
        error: String(error),
        timestamp: new Date().toISOString()
      });
    }
  };

  const testProductsEndpoint = async () => {
    const endpoint = '/api/v1/products';
    updateTestResult(endpoint, { status: 'loading', method: 'GET' });

    try {
      console.log('🧪 [ApiTest] Testing /products endpoint...');
      
      // Get token info before making request
      const token = localStorage.getItem('smartseller_access_token');
      const tokenExpiry = localStorage.getItem('smartseller_token_expiry');
      const isTokenValid = token && tokenExpiry && new Date(tokenExpiry) > new Date();
      
      console.log('🧪 [ApiTest] Token info:', { 
        hasToken: !!token, 
        tokenExpiry, 
        isValid: isTokenValid 
      });

      const response = await enhancedApiClient.getClient().get({
        url: '/api/v1/products',
        query: { limit: 10 }
      });

      console.log('🧪 [ApiTest] /products response:', response);

      updateTestResult(endpoint, {
        status: 'success',
        statusCode: response.status,
        message: 'Products fetched successfully',
        tokenSent: isTokenValid,
        responseData: response.data,
        timestamp: new Date().toISOString()
      });
    } catch (error: unknown) {
      console.error('🧪 [ApiTest] /products error:', error);
      const errorObj = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      updateTestResult(endpoint, {
        status: 'error',
        statusCode: errorObj.response?.status || 500,
        message: errorObj.response?.data?.message || errorObj.message || 'Failed to fetch products',
        error: String(error),
        timestamp: new Date().toISOString()
      });
    }
  };

  const testDirectApiCall = async () => {
    const endpoint = '/api/v1/products (direct)';
    updateTestResult(endpoint, { status: 'loading', method: 'GET' });

    try {
      console.log('🧪 [ApiTest] Testing direct API call with manual headers...');
      
      const token = localStorage.getItem('smartseller_access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🧪 [ApiTest] Adding Authorization header:', `Bearer ${token.substring(0, 20)}...`);
      }

      const apiBaseUrl = import.meta.env.VITE_BACKEND_HOST || import.meta.env.VITE_API_BASE_URL || 'https://smartseller-api.preproduction.kirimku.com';
      const response = await fetch(`${apiBaseUrl}/api/v1/products?limit=10`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      console.log('🧪 [ApiTest] Direct API response:', { status: response.status, data });

      updateTestResult(endpoint, {
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        message: response.ok ? 'Direct API call successful' : 'Direct API call failed',
        tokenSent: !!token,
        responseData: data,
        timestamp: new Date().toISOString()
      });
    } catch (error: unknown) {
      console.error('🧪 [ApiTest] Direct API error:', error);
      const errorObj = error as { message?: string };
      updateTestResult(endpoint, {
        status: 'error',
        statusCode: 500,
        message: errorObj.message || 'Direct API call failed',
        error: String(error),
        timestamp: new Date().toISOString()
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      await testUsersMe();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
      await testProductsEndpoint();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
      await testDirectApiCall();
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status'], statusCode?: number) => {
    const variant = status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary';
    return (
      <Badge variant={variant}>
        {statusCode ? `${status.toUpperCase()} (${statusCode})` : status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          API Authentication Test Suite
        </CardTitle>
        <CardDescription>
          Test various API endpoints to debug bearer token authentication issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Run All Tests
          </Button>
          <Button 
            onClick={testUsersMe} 
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Test /users/me
          </Button>
          <Button 
            onClick={testProductsEndpoint} 
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Test /products
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <h3 className="text-lg font-semibold">Test Results</h3>
            
            {testResults.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <CardTitle className="text-base">{result.method} {result.endpoint}</CardTitle>
                        <CardDescription className="text-sm">
                          {result.timestamp && `Tested at ${new Date(result.timestamp).toLocaleTimeString()}`}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(result.status, result.statusCode)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {result.message && (
                    <Alert>
                      <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Token Sent:</strong> {result.tokenSent ? '✅ Yes' : '❌ No'}
                    </div>
                    {result.statusCode && (
                      <div>
                        <strong>Status Code:</strong> {result.statusCode}
                      </div>
                    )}
                  </div>

                  {result.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Error:</strong> {result.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.responseData && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium">Response Data</summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.responseData, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiTestComponent;