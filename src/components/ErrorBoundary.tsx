import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '../shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/components/ui/card';
import { Alert, AlertDescription } from '../shared/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // Create error report
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In a real app, you'd send this to your error reporting service
    console.log('Error Report:', errorReport);
    
    // For now, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please share this with support.');
      })
      .catch(() => {
        alert('Unable to copy error report. Please take a screenshot.');
      });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600">
                We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error ID for support */}
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error ID:</strong> {this.state.errorId}
                  <br />
                  <span className="text-sm text-gray-500">
                    Please include this ID when contacting support.
                  </span>
                </AlertDescription>
              </Alert>

              {/* Error details (only in development or if explicitly enabled) */}
              {(process.env.NODE_ENV === 'development' || this.props.showErrorDetails) && this.state.error && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Error Details:</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-40">
                    {this.state.error.message}
                  </pre>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        Stack Trace
                      </summary>
                      <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap overflow-auto max-h-60">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleReportError}
                  className="flex-1"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Error
                </Button>
              </div>

              {/* Support information */}
              <div className="text-center text-sm text-gray-500">
                <p>
                  If this problem continues, please contact our support team at{' '}
                  <a 
                    href="mailto:support@smartseller.com" 
                    className="text-blue-600 hover:text-blue-800"
                  >
                    support@smartseller.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for handling async errors in components
export function useErrorHandler() {
  const handleError = (error: Error) => {
    // In a real app, you might want to throw this error to be caught by ErrorBoundary
    // or handle it in a different way
    console.error('Async error caught:', error);
    
    // For now, we'll just log it. In a real app, you might:
    // 1. Show a toast notification
    // 2. Send to error reporting service
    // 3. Update global error state
  };

  return { handleError };
}