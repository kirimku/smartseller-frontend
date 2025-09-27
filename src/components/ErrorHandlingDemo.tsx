import React, { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { ErrorHandler } from '../lib/error-handler';
import { useLoadingManager, useSimpleLoading } from '../lib/loading-manager';

/**
 * Demo component to test error handling and loading states
 * This component demonstrates various error scenarios and loading states
 */
export const ErrorHandlingDemo: React.FC = () => {
  const [lastError, setLastError] = useState<string | null>(null);
  const loadingManager = useLoadingManager();
  const { isLoading: simpleLoading, startLoading: startSimpleLoading, stopLoading: stopSimpleLoading } = useSimpleLoading();

  // Simulate different types of errors
  const simulateNetworkError = async () => {
    try {
      setLastError(null);
      await loadingManager.executeAsync({
        execute: async () => {
          // Simulate network error
          const error = new Error('Network Error');
          (error as Error & { code?: string }).code = 'NETWORK_ERROR';
          throw error;
        },
        loadingMessage: 'Testing network error...'
      }, 'network-test');
    } catch (error) {
      const parsedError = ErrorHandler.parseError(error);
      const message = ErrorHandler.getUserMessage(parsedError);
      setLastError(message);
    }
  };

  const simulateValidationError = async () => {
    try {
      setLastError(null);
      await loadingManager.executeAsync({
        execute: async () => {
          // Simulate validation error
          const error = {
            response: {
              status: 400,
              data: {
                success: false,
                message: 'Validation failed',
                errors: [
                  { field: 'email', message: 'Email is required' },
                  { field: 'password', message: 'Password must be at least 8 characters' }
                ]
              }
            }
          };
          throw error;
        },
        loadingMessage: 'Testing validation error...'
      }, 'validation-test');
    } catch (error) {
      const parsedError = ErrorHandler.parseError(error);
      const message = ErrorHandler.getUserMessage(parsedError);
      setLastError(message);
    }
  };

  const simulateAuthError = async () => {
    try {
      setLastError(null);
      await loadingManager.executeAsync({
        execute: async () => {
          // Simulate authentication error
          const error = {
            response: {
              status: 401,
              data: {
                success: false,
                message: 'Invalid credentials'
              }
            }
          };
          throw error;
        },
        loadingMessage: 'Testing auth error...'
      }, 'auth-test');
    } catch (error) {
      const parsedError = ErrorHandler.parseError(error);
      const message = ErrorHandler.getUserMessage(parsedError);
      setLastError(message);
    }
  };

  const simulateSimpleLoading = async () => {
    startSimpleLoading('Testing simple loading...');
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    stopSimpleLoading();
  };

  const simulateSuccessOperation = async () => {
    try {
      setLastError(null);
      await loadingManager.executeAsync({
        execute: async () => {
          // Simulate successful operation
          await new Promise(resolve => setTimeout(resolve, 1500));
          return 'Operation completed successfully!';
        },
        loadingMessage: 'Processing success operation...',
        onSuccess: () => {
          setLastError('✅ Operation completed successfully!');
        }
      }, 'success-test');
    } catch (error) {
      const parsedError = ErrorHandler.parseError(error);
      const message = ErrorHandler.getUserMessage(parsedError);
      setLastError(message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Handling & Loading States Demo</CardTitle>
          <CardDescription>
            Test various error scenarios and loading states to verify the error handling system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Loading States Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Loading States</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={simulateSimpleLoading}
                disabled={simpleLoading}
                variant="outline"
              >
                {simpleLoading ? 'Loading...' : 'Test Simple Loading'}
              </Button>
              
              <Button 
                onClick={simulateSuccessOperation}
                disabled={loadingManager.isLoading('success-test')}
                variant="outline"
              >
                {loadingManager.isLoading('success-test') ? 'Processing...' : 'Test Success Operation'}
              </Button>
            </div>
          </div>

          {/* Error Scenarios Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Error Scenarios</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={simulateNetworkError}
                disabled={loadingManager.isLoading('network-test')}
                variant="destructive"
              >
                {loadingManager.isLoading('network-test') ? 'Testing...' : 'Test Network Error'}
              </Button>
              
              <Button 
                onClick={simulateValidationError}
                disabled={loadingManager.isLoading('validation-test')}
                variant="destructive"
              >
                {loadingManager.isLoading('validation-test') ? 'Testing...' : 'Test Validation Error'}
              </Button>
              
              <Button 
                onClick={simulateAuthError}
                disabled={loadingManager.isLoading('auth-test')}
                variant="destructive"
              >
                {loadingManager.isLoading('auth-test') ? 'Testing...' : 'Test Auth Error'}
              </Button>
            </div>
          </div>

          {/* Loading Status Display */}
          {(loadingManager.isLoading() || simpleLoading) && (
            <Alert>
              <AlertDescription>
                Loading operations are currently active...
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {lastError && (
            <Alert variant={lastError.startsWith('✅') ? 'default' : 'destructive'}>
              <AlertDescription>{lastError}</AlertDescription>
            </Alert>
          )}

          {/* Clear Button */}
          <Button 
            onClick={() => setLastError(null)}
            variant="ghost"
            size="sm"
          >
            Clear Messages
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};