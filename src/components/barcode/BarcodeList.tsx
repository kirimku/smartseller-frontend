import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Search, Filter, Download, Eye, MoreHorizontal, QrCode, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../../hooks/use-toast';
import { enhancedApiClient } from '../../lib/security/enhanced-api-client';

// API payload for barcodes
interface ApiBarcode {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  barcode_value: string;
  status: string; // e.g. "generated"
  expiry_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Internal model used for rendering in this component
interface Barcode {
  id: string;
  barcode: string;
  product_id: string;
  product_name: string;
  batch_id: string;
  batch_name: string;
  status: 'active' | 'used' | 'expired' | 'revoked' | 'generated' | string;
  created_at: string;
  expires_at: string;
  used_at?: string;
  customer_id?: string;
  warranty_claim_id?: string;
}

interface PaginationInfo {
  page?: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_prev: boolean;
}

interface BarcodeListResponse {
  data: {
    data: ApiBarcode[];
    pagination?: PaginationInfo;
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

interface BarcodeListProps {
  onViewDetails?: (barcode: Barcode) => void;
}

export const BarcodeList: React.FC<BarcodeListProps> = ({ onViewDetails }) => {
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_prev: false
  });
  const { toast } = useToast();

  // QR modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrBarcode, setQrBarcode] = useState<string | null>(null);
  const [qrOptions, setQrOptions] = useState<{ size: number; error_level: 'L'|'M'|'Q'|'H'; format: 'base64'|'png'; }>({ size: 256, error_level: 'M', format: 'base64' });
  const currentQrIdRef = useRef<string | null>(null);

  const fetchBarcodes = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: 20
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await enhancedApiClient.getClient().get({
        url: '/api/v1/admin/warranty/barcodes',
        query: params
      });

      // Handle both wrapped and unwrapped API responses without relying on `success`
      const root = response.data as unknown as { data?: { data?: ApiBarcode[]; pagination?: PaginationInfo } };
      const items: ApiBarcode[] = root?.data?.data ?? [];
      const mapped: Barcode[] = items.map((b) => ({
        id: b.id,
        barcode: b.barcode_value,
        product_id: b.product_id,
        product_name: b.product_name || '-',
        batch_id: '',
        batch_name: '',
        status: (b.status as Barcode['status']) || 'generated',
        created_at: b.created_at,
        expires_at: b.expiry_date,
      }));

      setBarcodes(mapped);
      const pg = root?.data?.pagination;
      setPagination(pg ?? {
        total_pages: 1,
        total_items: mapped.length,
        has_next: false,
        has_prev: false,
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to fetch barcodes';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarcodes();
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchBarcodes();
  };

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      
      if (searchTerm) {
        params.search = searchTerm;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await enhancedApiClient.getClient().get({
        url: '/api/v1/admin/warranty/barcodes/export',
        query: params,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `barcodes-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Barcodes exported successfully",
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Export failed';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
      case 'generated':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.startsWith('0001-01-01')) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // QR generation helpers
  const toDataUrlFromBase64Png = (base64: string) => `data:image/png;base64,${base64}`;
  
  const createBlobFromBase64 = (base64: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/png' });
  };
  
  const openQrModal = async (b: Barcode) => {
    setQrBarcode(b.barcode);
    currentQrIdRef.current = b.id;
    setQrError(null);
    setQrDataUrl(null);
    setQrModalOpen(true);
    await fetchQr(b.id, qrOptions);
  };
  
  const fetchQr = async (id: string, opts: { size: number; error_level: 'L'|'M'|'Q'|'H'; format: 'base64'|'png'; }) => {
    setQrLoading(true);
    setQrError(null);
    try {
      const response = await enhancedApiClient.getClient().get({
        url: `/api/v1/admin/warranty/barcodes/${id}/qr`,
        query: { size: opts.size, error_level: opts.error_level, format: 'base64' },
      });
      const root = response.data as { success?: boolean; data?: { qr_code?: string | { base64_data?: string } } };
      const qrPayload = root?.data?.qr_code;
      const qrBase64 = typeof qrPayload === 'string' ? qrPayload : qrPayload?.base64_data;
      if (!qrBase64) {
        throw new Error('QR code not returned by server');
      }
      setQrDataUrl(toDataUrlFromBase64Png(qrBase64));
    } catch (e) {
      const err = e as ApiError;
      const msg = err?.response?.data?.message || err?.message || 'Failed to generate QR';
      setQrError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setQrLoading(false);
    }
  };
  
  const updateQrOptions = async (newOpts: Partial<{ size: number; error_level: 'L'|'M'|'Q'|'H'; format: 'base64'|'png'; }>) => {
    const merged = { ...qrOptions, ...newOpts };
    setQrOptions(merged);
    const id = currentQrIdRef.current;
    if (qrModalOpen && id) {
      await fetchQr(id, merged);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Barcode Management</span>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by barcode, product, or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Barcodes Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Barcode</TableHead>
                  <TableHead className="min-w-[150px]">Product</TableHead>
                  <TableHead className="min-w-[120px]">Batch</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Created</TableHead>
                  <TableHead className="min-w-[100px]">Expires</TableHead>
                  <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading barcodes...
                  </TableCell>
                </TableRow>
              ) : barcodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No barcodes found
                  </TableCell>
                </TableRow>
              ) : (
                barcodes.map((barcode) => (
                  <TableRow key={barcode.id}>
                    <TableCell className="font-mono text-sm">
                      {barcode.barcode}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{barcode.product_name}</div>
                        <div className="text-sm text-gray-500">ID: {barcode.product_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{barcode.batch_name}</div>
                        <div className="text-sm text-gray-500">ID: {barcode.batch_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(barcode.status)}>
                        {barcode.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(barcode.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(barcode.expires_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails?.(barcode)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openQrModal(barcode)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Generate QR
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.total_items)} of {pagination.total_items} barcodes
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.has_prev}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {currentPage} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.has_next}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* QR Preview Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code {qrBarcode ? `for ${qrBarcode}` : ''}
            </DialogTitle>
          </DialogHeader>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-sm text-gray-600">Size</label>
              <Select value={String(qrOptions.size)} onValueChange={(v) => updateQrOptions({ size: parseInt(v, 10) })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">128</SelectItem>
                  <SelectItem value="256">256</SelectItem>
                  <SelectItem value="512">512</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Error Level</label>
              <Select value={qrOptions.error_level} onValueChange={(v) => updateQrOptions({ error_level: v as 'L'|'M'|'Q'|'H' })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="Q">Q</SelectItem>
                  <SelectItem value="H">H</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {qrError && (
            <Alert variant="destructive">
              <AlertDescription>{qrError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center gap-3">
            {qrLoading ? (
              <div className="py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="Barcode QR" className="border rounded" style={{ width: qrOptions.size, height: qrOptions.size }} />
            ) : (
              <div className="text-sm text-gray-500">QR not generated yet</div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const id = currentQrIdRef.current;
                if (id) fetchQr(id, qrOptions);
              }}>
                Refresh
              </Button>
              <Button size="sm" onClick={downloadCurrentQr} disabled={!qrDataUrl}>
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const downloadCurrentQr = () => {
  if (!qrDataUrl || !qrBarcode) return;
  const base64 = qrDataUrl.split(',')[1];
  const blob = createBlobFromBase64(base64);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `barcode-${qrBarcode}-qr.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};