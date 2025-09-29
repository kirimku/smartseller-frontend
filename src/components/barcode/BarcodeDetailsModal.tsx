import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Package,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Download,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
  History
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { apiClient } from '../../lib/api-client';

interface BarcodeDetails {
  id: string;
  barcode: string;
  status: 'active' | 'used' | 'expired' | 'revoked';
  product_id: string;
  product_name: string;
  product_sku?: string;
  batch_id: string;
  batch_name: string;
  warranty_period_months: number;
  created_at: string;
  expires_at: string;
  used_at?: string;
  revoked_at?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  warranty_claim_id?: string;
  notes?: string;
  metadata?: {
    generation_source?: string;
    last_scanned?: string;
    scan_count?: number;
    qr_code_url?: string;
    pdf_url?: string;
  };
  audit_log?: Array<{
    id: string;
    action: string;
    timestamp: string;
    user_id?: string;
    user_name?: string;
    details?: string;
  }>;
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

interface BarcodeDetailsModalProps {
  barcodeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeDetailsModal: React.FC<BarcodeDetailsModalProps> = ({
  barcodeId,
  isOpen,
  onClose,
}) => {
  const [details, setDetails] = useState<BarcodeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && barcodeId) {
      fetchBarcodeDetails();
    }
  }, [isOpen, barcodeId]);

  const fetchBarcodeDetails = async () => {
    if (!barcodeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get({
        url: `/api/v1/admin/warranty/barcodes/${barcodeId}`
      });

      const apiResponse = response.data as ApiResponse<BarcodeDetails>;
      if (apiResponse?.success && apiResponse.data) {
        setDetails(apiResponse.data);
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to fetch barcode details';
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

  const handleAction = async (action: string, endpoint: string) => {
    if (!barcodeId) return;

    setActionLoading(action);

    try {
      const response = await apiClient.post({
        url: endpoint,
        data: { barcode_id: barcodeId }
      });

      const apiResponse = response.data as ApiResponse<{ message: string }>;
      if (apiResponse?.success) {
        toast({
          title: "Success",
          description: `Barcode ${action} successfully`,
        });
        fetchBarcodeDetails(); // Refresh details
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError?.response?.data?.message || apiError?.message || `Failed to ${action} barcode`;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Success",
        description: `${filename} downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Barcode Details</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {details && (
          <div className="space-y-6">
            {/* Header with Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-medium">{details.barcode}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(details.barcode, 'Barcode')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">ID: {details.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(details.status)}
                <Badge variant={getStatusBadgeVariant(details.status)}>
                  {details.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {details.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('revoked', `/api/v1/admin/warranty/barcodes/${details.id}/revoke`)}
                  disabled={actionLoading === 'revoked'}
                >
                  {actionLoading === 'revoked' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Revoke
                </Button>
              )}
              
              {details.metadata?.qr_code_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(details.metadata!.qr_code_url!, `barcode-${details.barcode}-qr.png`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
              )}
              
              {details.metadata?.pdf_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(details.metadata!.pdf_url!, `barcode-${details.barcode}.pdf`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
            </div>

            <Separator />

            {/* Product Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Product Name</p>
                  <p className="font-medium">{details.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Product ID</p>
                  <p className="font-medium">{details.product_id}</p>
                </div>
                {details.product_sku && (
                  <div>
                    <p className="text-sm text-gray-600">SKU</p>
                    <p className="font-medium">{details.product_sku}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Warranty Period</p>
                  <p className="font-medium">{details.warranty_period_months} months</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Batch Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Batch Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Batch Name</p>
                  <p className="font-medium">{details.batch_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch ID</p>
                  <p className="font-medium">{details.batch_id}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">{formatDate(details.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Expires</p>
                    <p className="font-medium">{formatDate(details.expires_at)}</p>
                  </div>
                </div>
                
                {details.used_at && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Used</p>
                      <p className="font-medium">{formatDate(details.used_at)}</p>
                    </div>
                  </div>
                )}
                
                {details.revoked_at && (
                  <div className="flex items-center gap-3">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600">Revoked</p>
                      <p className="font-medium">{formatDate(details.revoked_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            {details.customer_id && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Customer ID</p>
                      <p className="font-medium">{details.customer_id}</p>
                    </div>
                    {details.customer_name && (
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{details.customer_name}</p>
                      </div>
                    )}
                    {details.customer_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{details.customer_email}</p>
                        </div>
                      </div>
                    )}
                    {details.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{details.customer_phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {details.warranty_claim_id && (
                    <div>
                      <p className="text-sm text-gray-600">Warranty Claim ID</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{details.warranty_claim_id}</p>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Notes */}
            {details.notes && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{details.notes}</p>
                  </div>
                </div>
              </>
            )}

            {/* Metadata */}
            {details.metadata && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {details.metadata.generation_source && (
                      <div>
                        <p className="text-sm text-gray-600">Generation Source</p>
                        <p className="font-medium">{details.metadata.generation_source}</p>
                      </div>
                    )}
                    
                    {details.metadata.scan_count !== undefined && (
                      <div>
                        <p className="text-sm text-gray-600">Scan Count</p>
                        <p className="font-medium">{details.metadata.scan_count}</p>
                      </div>
                    )}
                    
                    {details.metadata.last_scanned && (
                      <div>
                        <p className="text-sm text-gray-600">Last Scanned</p>
                        <p className="font-medium">{formatDate(details.metadata.last_scanned)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Audit Log */}
            {details.audit_log && details.audit_log.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Audit Log
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {details.audit_log.map((log) => (
                      <div key={log.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                        </div>
                        {log.user_name && (
                          <p className="text-sm text-gray-600">by {log.user_name}</p>
                        )}
                        {log.details && (
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};