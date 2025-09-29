import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Download
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { apiClient } from '../../lib/api-client';

interface BarcodeStats {
  total_generated: number;
  active_count: number;
  used_count: number;
  expired_count: number;
  revoked_count: number;
  generation_rate_24h: number;
  usage_rate_24h: number;
  top_products: Array<{
    product_id: string;
    product_name: string;
    barcode_count: number;
    usage_rate: number;
  }>;
  recent_activity: Array<{
    id: string;
    type: 'generated' | 'used' | 'expired' | 'revoked';
    barcode: string;
    product_name: string;
    timestamp: string;
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

export const BarcodeStatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<BarcodeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const { toast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get({
        url: '/api/v1/admin/warranty/barcodes/stats',
        params: { time_range: timeRange }
      });

      const apiResponse = response.data as ApiResponse<BarcodeStats>;
      if (apiResponse?.success && apiResponse.data) {
        setStats(apiResponse.data);
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to fetch statistics';
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
    fetchStats();
  }, [timeRange]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'generated':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'used':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'revoked':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case 'generated':
        return 'default';
      case 'used':
        return 'secondary';
      case 'expired':
        return 'destructive';
      case 'revoked':
        return 'outline';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportStats = async () => {
    try {
      const response = await apiClient.get({
        url: '/api/v1/admin/warranty/barcodes/stats/export',
        params: { time_range: timeRange },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `barcode-stats-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Statistics exported successfully",
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

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Barcode Statistics</h2>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Barcode Statistics</h2>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchStats} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportStats} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Generated</p>
                <p className="text-2xl font-bold">{stats?.total_generated?.toLocaleString() || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{stats?.generation_rate_24h || 0}% (24h)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats?.active_count?.toLocaleString() || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-500">
                {stats?.total_generated ? Math.round((stats.active_count / stats.total_generated) * 100) : 0}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Used</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.used_count?.toLocaleString() || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{stats?.usage_rate_24h || 0}% (24h)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired/Revoked</p>
                <p className="text-2xl font-bold text-red-600">
                  {((stats?.expired_count || 0) + (stats?.revoked_count || 0)).toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-500">
                {stats?.total_generated ? Math.round(((stats.expired_count + stats.revoked_count) / stats.total_generated) * 100) : 0}% of total
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Barcode Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.top_products?.length ? (
                stats.top_products.slice(0, 5).map((product, index) => (
                  <div key={product.product_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-gray-500">{product.barcode_count} barcodes</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {product.usage_rate}% used
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recent_activity?.length ? (
                stats.recent_activity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{activity.product_name}</p>
                        <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                          {activity.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">{activity.barcode}</p>
                      {activity.details && (
                        <p className="text-xs text-gray-400">{activity.details}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};