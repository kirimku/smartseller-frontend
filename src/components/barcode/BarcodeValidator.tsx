import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Package,
  Calendar,
  User,
  Loader2
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { enhancedApiClient } from '../../lib/security/enhanced-api-client';

interface BarcodeValidationResult {
  barcode: string;
  is_valid: boolean;
  status: 'active' | 'used' | 'expired' | 'revoked' | 'not_found';
  product_id?: string;
  product_name?: string;
  batch_id?: string;
  batch_name?: string;
  created_at?: string;
  expires_at?: string;
  used_at?: string;
  customer_id?: string;
  warranty_claim_id?: string;
  validation_errors?: string[];
  metadata?: {
    generation_source?: string;
    last_scanned?: string;
    scan_count?: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export const BarcodeValidator: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BarcodeValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateBarcode = async () => {
    if (!barcode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a barcode to validate",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await enhancedApiClient.getClient().get({
        url: `/api/v1/admin/warranty/barcodes/${encodeURIComponent(barcode.trim())}/validate`
      });

      const apiResponse = response.data as ApiResponse<BarcodeValidationResult>;
      if (apiResponse?.success && apiResponse.data) {
        setResult(apiResponse.data);
        
        if (apiResponse.data.is_valid) {
          toast({
            title: "Validation Complete",
            description: `Barcode is ${apiResponse.data.status}`,
          });
        } else {
          toast({
            title: "Validation Complete",
            description: "Barcode validation failed",
            variant: "destructive",
          });
        }
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Validation failed';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'used':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'revoked':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'not_found':
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'used':
        return 'secondary';
      case 'expired':
        return 'destructive';
      case 'revoked':
        return 'outline';
      case 'not_found':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateBarcode();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Barcode Validator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="barcode"
                placeholder="Enter barcode to validate..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="font-mono flex-1"
              />
              <Button 
                onClick={validateBarcode} 
                disabled={loading || !barcode.trim()}
                className="sm:w-auto w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                <span className="sm:inline hidden">Validate</span>
                <span className="sm:hidden inline">Validate Barcode</span>
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(result.status)}
              Validation Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Overview */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Barcode Status</p>
                <p className="font-mono text-lg font-medium">{result.barcode}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(result.status)} className="text-sm">
                {result.status.toUpperCase()}
              </Badge>
            </div>

            {/* Validation Errors */}
            {result.validation_errors && result.validation_errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Validation Issues:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.validation_errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Product Information */}
            {result.product_name && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Product Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Product</span>
                    </div>
                    <p className="font-medium">{result.product_name}</p>
                    <p className="text-sm text-gray-500">ID: {result.product_id}</p>
                  </div>
                  
                  {result.batch_name && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Batch</span>
                      </div>
                      <p className="font-medium">{result.batch_name}</p>
                      <p className="text-sm text-gray-500">ID: {result.batch_id}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline Information */}
            {result.created_at && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium">{formatDate(result.created_at)}</p>
                    </div>
                  </div>
                  
                  {result.expires_at && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Expires</p>
                        <p className="font-medium">{formatDate(result.expires_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {result.used_at && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Used</p>
                        <p className="font-medium">{formatDate(result.used_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customer Information */}
            {result.customer_id && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Customer ID</p>
                    <p className="font-medium">{result.customer_id}</p>
                  </div>
                </div>
                
                {result.warranty_claim_id && (
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Warranty Claim ID</p>
                      <p className="font-medium">{result.warranty_claim_id}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            {result.metadata && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.metadata.generation_source && (
                    <div>
                      <p className="text-sm text-gray-600">Generation Source</p>
                      <p className="font-medium">{result.metadata.generation_source}</p>
                    </div>
                  )}
                  
                  {result.metadata.scan_count !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Scan Count</p>
                      <p className="font-medium">{result.metadata.scan_count}</p>
                    </div>
                  )}
                  
                  {result.metadata.last_scanned && (
                    <div>
                      <p className="text-sm text-gray-600">Last Scanned</p>
                      <p className="font-medium">{formatDate(result.metadata.last_scanned)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};