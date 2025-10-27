import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Separator } from '../../shared/components/ui/separator';
import { Loader2, QrCode, AlertTriangle, Download } from 'lucide-react';
import { enhancedApiClient } from '../../lib/security/enhanced-api-client';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

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

const QRTestComponent: React.FC = () => {
  const [barcodeId, setBarcodeId] = useState('');
  const [tenantId, setTenantId] = useState<string>(localStorage.getItem('current-tenant') || '');
  const [size, setSize] = useState<number>(256);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [format, setFormat] = useState<'base64' | 'png'>('base64');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [base64Input, setBase64Input] = useState('');
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const applyTenant = () => {
    if (tenantId) {
      localStorage.setItem('current-tenant', tenantId);
    } else {
      localStorage.removeItem('current-tenant');
    }
  };

  const fetchQr = async () => {
    setLoading(true);
    setError(null);
    setQrDataUrl(null);
    try {
      // Ensure tenant header will be populated by the client
      applyTenant();

      if (!barcodeId) {
        throw new Error('Please provide a barcode ID');
      }

      if (format === 'png') {
        const response = await enhancedApiClient.getClient().get({
          url: `/api/v1/admin/warranty/barcodes/${barcodeId}/qr`,
          query: { size, error_level: errorLevel, format: 'png' },
          responseType: 'blob',
        });
        const blob = response.data as Blob;
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setQrDataUrl(url);
      } else {
        const response = await enhancedApiClient.getClient().get({
          url: `/api/v1/admin/warranty/barcodes/${barcodeId}/qr`,
          query: { size, error_level: errorLevel, format: 'base64' },
        });
        const root = response.data as { success?: boolean; data?: { qr_code?: string | { base64_data?: string } } };
        const payload = root?.data?.qr_code;
        const qrBase64 = typeof payload === 'string' ? payload : payload?.base64_data;
        if (!qrBase64) {
          throw new Error('QR code not returned by server');
        }
        setQrDataUrl(toDataUrlFromBase64Png(qrBase64));
      }
    } catch (e) {
      const err = e as ApiError;
      const msg = err?.response?.data?.message || err?.message || 'Failed to generate QR';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderBase64Locally = () => {
    setError(null);
    try {
      if (!base64Input) {
        throw new Error('Paste a base64 PNG string to render');
      }
      setQrDataUrl(toDataUrlFromBase64Png(base64Input.trim()));
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'Invalid base64');
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    let urlForDownload = qrDataUrl;
    let tempCreated = false;
    if (qrDataUrl.startsWith('data:')) {
      const base64 = qrDataUrl.split(',')[1];
      const blob = createBlobFromBase64(base64);
      urlForDownload = URL.createObjectURL(blob);
      tempCreated = true;
    }
    const a = document.createElement('a');
    a.href = urlForDownload;
    a.download = `barcode-${barcodeId || 'qr'}-${size}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (tempCreated) {
      URL.revokeObjectURL(urlForDownload);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Debug Sandbox
        </CardTitle>
        <CardDescription>
          Generate and preview QR codes via API or local base64 to verify inline rendering.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant">Tenant ID (X-Tenant-ID)</Label>
            <div className="flex gap-2">
              <Input id="tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="e.g. rexus-001" />
              <Button variant="outline" onClick={applyTenant}>Apply</Button>
            </div>
            <p className="text-xs text-muted-foreground">Stored in localStorage as "current-tenant".</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcodeId">Barcode ID</Label>
            <Input id="barcodeId" value={barcodeId} onChange={(e) => setBarcodeId(e.target.value)} placeholder="Enter barcode record ID" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Size</Label>
            <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
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
          <div className="space-y-2">
            <Label>Error Level</Label>
            <Select value={errorLevel} onValueChange={(v) => setErrorLevel(v as 'L'|'M'|'Q'|'H')}>
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
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as 'base64'|'png')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base64">Base64</SelectItem>
                <SelectItem value="png">PNG (blob)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={fetchQr} className="flex items-center gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            Generate via API
          </Button>
          <Button variant="outline" onClick={downloadQr} disabled={!qrDataUrl} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PNG
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <div className="py-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt="Barcode QR" className="border rounded" style={{ width: size, height: size }} />
          ) : (
            <div className="text-sm text-gray-500">QR not generated yet</div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="base64">Local Base64 (PNG)</Label>
          <Input id="base64" value={base64Input} onChange={(e) => setBase64Input(e.target.value)} placeholder="Paste base64 string only (no data: prefix)" />
          <Button variant="secondary" onClick={renderBase64Locally}>Render Base64 Inline</Button>
          <p className="text-xs text-muted-foreground">Use this to verify inline rendering without backend auth.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRTestComponent;