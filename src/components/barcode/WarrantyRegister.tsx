import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription } from '../ui/alert';
import { Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { enhancedApiClient } from '../../lib/security/enhanced-api-client';

interface ApiPendingRegistration {
  id: string;
  barcode_value: string;
  product_id?: string;
  product_name?: string;
  product_sku?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  registration_date?: string;
  status?: string; // expecting "waiting_approval"
}

interface PendingRegistrationItem {
  id: string;
  barcode: string;
  product_name: string;
  product_sku?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  registration_date?: string;
  status: string;
}

interface PaginationInfo {
  current_page?: number;
  total_pages?: number;
  total_items?: number;
  has_next?: boolean;
  has_prev?: boolean;
}

export const WarrantyRegister: React.FC = () => {
  const [items, setItems] = useState<PendingRegistrationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Helpers for safe API typing and error messages
  type ApiBaseResponse = { success?: boolean; message?: string };
  function isApiBaseResponse(data: unknown): data is ApiBaseResponse {
    return typeof data === 'object' && data !== null;
  }
  type ApiErrorLike = { response?: { data?: { message?: string } }; message?: string };
  function extractMessage(err: unknown, fallback: string): string {
    if (typeof err === 'string') return err;
    if (err instanceof Error && typeof err.message === 'string') return err.message;
    if (typeof err === 'object' && err !== null) {
      const e = err as ApiErrorLike;
      if (typeof e.response?.data?.message === 'string') return e.response.data.message;
      if (typeof e.message === 'string') return e.message;
    }
    return fallback;
  }

  const fetchPendingRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: 20,
      };
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await enhancedApiClient.getClient().get({
        url: '/api/v1/admin/warranty/barcodes/pending-approval',
        query: params,
      });

      const root = response.data as unknown as { data?: { data?: ApiPendingRegistration[]; pagination?: PaginationInfo } };
      const items: ApiPendingRegistration[] = root?.data?.data ?? [];

      const mapped: PendingRegistrationItem[] = items.map((i) => ({
        id: i.id,
        barcode: i.barcode_value,
        product_name: i.product_name || '-',
        product_sku: i.product_sku,
        customer_name: i.customer_name,
        customer_email: i.customer_email,
        customer_phone: i.customer_phone,
        registration_date: i.registration_date,
        status: i.status || 'waiting_approval',
      }));

      setItems(mapped);
      const pg = root?.data?.pagination;
      setPagination(
        pg ?? {
          current_page: 1,
          total_pages: 1,
          total_items: mapped.length,
          has_next: false,
          has_prev: false,
        }
      );
    } catch (error: unknown) {
      const errorMessage = extractMessage(error, 'Failed to fetch pending registrations');
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const approveRegistration = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await enhancedApiClient.getClient().post({
        url: `/api/v1/admin/warranty/barcodes/${encodeURIComponent(id)}/approve-registration`,
        body: {},
      });
      const data = response.data as unknown;
      const isOk = !(
        isApiBaseResponse(data) &&
        typeof data.success === 'boolean' &&
        data.success === false
      );
      if (isOk) {
        toast({ title: 'Approved', description: 'Registration approved and activated.' });
        await fetchPendingRegistrations();
      } else {
        const msg =
          isApiBaseResponse(data) && typeof data.message === 'string'
            ? data.message
            : 'Approval failed';
        throw new Error(msg);
      }
    } catch (error: unknown) {
      const errorMessage = extractMessage(error, 'Failed to approve registration');
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRegistration = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await enhancedApiClient.getClient().post({
        url: `/api/v1/admin/warranty/barcodes/${encodeURIComponent(id)}/reject-registration`,
        body: { reason: 'Not eligible' },
      });
      const data = response.data as unknown;
      const isOk = !(
        isApiBaseResponse(data) &&
        typeof data.success === 'boolean' &&
        data.success === false
      );
      if (isOk) {
        toast({ title: 'Rejected', description: 'Registration rejected.' });
        await fetchPendingRegistrations();
      } else {
        const msg =
          isApiBaseResponse(data) && typeof data.message === 'string'
            ? data.message
            : 'Rejection failed';
        throw new Error(msg);
      }
    } catch (error: unknown) {
      const errorMessage = extractMessage(error, 'Failed to reject registration');
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchPendingRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPendingRegistrations();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Warranty Registration Approvals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by barcode or customer"
                value={searchTerm}
                onChange={onSearch}
                className="pl-10 w-64"
              />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          )}
        </div>

        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barcode</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.barcode}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{item.product_name}</span>
                      {item.product_sku && <span className="text-xs text-muted-foreground">SKU: {item.product_sku}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{item.customer_name || '-'}</span>
                      <span className="text-xs text-muted-foreground">{item.customer_email || ''}</span>
                      <span className="text-xs text-muted-foreground">{item.customer_phone || ''}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.registration_date ? new Date(item.registration_date).toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveRegistration(item.id)}
                        disabled={actionLoading === item.id}
                        className="flex items-center gap-1"
                      >
                        {actionLoading === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectRegistration(item.id)}
                        disabled={actionLoading === item.id}
                        className="flex items-center gap-1"
                      >
                        {actionLoading === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {items.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="text-center text-sm text-muted-foreground py-10">No pending registrations found</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {pagination.current_page || 1} of {pagination.total_pages || 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!pagination.has_prev}
                onClick={() => setCurrentPage((p) => Math.max(1, (p || 1) - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!pagination.has_next}
                onClick={() => setCurrentPage((p) => (p || 1) + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};