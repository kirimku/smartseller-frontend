import React, { useState, useEffect } from 'react';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Badge } from '../../shared/components/ui/badge';
import { Separator } from '../../shared/components/ui/separator';
import { Switch } from '../../shared/components/ui/switch';
import { Label } from '../../shared/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../shared/components/ui/dialog';
import { 
  Loader2, 
  Shield, 
  Smartphone, 
  AlertCircle,
  CheckCircle,
  Settings,
  Key,
  Download,
  RefreshCw,
  Trash2,
  Plus,
  Clock,
  Calendar,
  MapPin,
  Monitor
} from 'lucide-react';
import TOTPSetup from './TOTPSetup';
import TOTPVerification from './TOTPVerification';

export interface MFAManagementProps {
  className?: string;
  onMFAStatusChange?: (enabled: boolean) => void;
}

interface MFADevice {
  id: string;
  name: string;
  type: 'totp' | 'sms' | 'email';
  isActive: boolean;
  lastUsed?: Date;
  createdAt: Date;
}

interface BackupCode {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt?: Date;
}

interface TrustedDevice {
  id: string;
  name: string;
  browser: string;
  os: string;
  location: string;
  lastSeen: Date;
  isCurrentDevice: boolean;
}

type DialogState = 'none' | 'setup' | 'disable' | 'regenerate-backup' | 'verify-disable';

export const MFAManagement: React.FC<MFAManagementProps> = ({
  className = '',
  onMFAStatusChange
}) => {
  // State
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);
  const [devices, setDevices] = useState<MFADevice[]>([]);
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogState, setDialogState] = useState<DialogState>('none');
  const [error, setError] = useState('');

  // Load MFA status and data
  useEffect(() => {
    const loadMFAData = async () => {
      try {
        // Here you would typically load from your API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data
        setIsMFAEnabled(true);
        setDevices([
          {
            id: '1',
            name: 'Google Authenticator',
            type: 'totp',
            isActive: true,
            lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        ]);
        setBackupCodes([
          { id: '1', code: '12345-67890', isUsed: false },
          { id: '2', code: '23456-78901', isUsed: true, usedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          { id: '3', code: '34567-89012', isUsed: false },
          { id: '4', code: '45678-90123', isUsed: false },
          { id: '5', code: '56789-01234', isUsed: false },
          { id: '6', code: '67890-12345', isUsed: false },
          { id: '7', code: '78901-23456', isUsed: false },
          { id: '8', code: '89012-34567', isUsed: false }
        ]);
        setTrustedDevices([
          {
            id: '1',
            name: 'MacBook Pro',
            browser: 'Chrome 120.0',
            os: 'macOS 14.0',
            location: 'San Francisco, CA',
            lastSeen: new Date(),
            isCurrentDevice: true
          },
          {
            id: '2',
            name: 'iPhone 15',
            browser: 'Safari 17.0',
            os: 'iOS 17.0',
            location: 'San Francisco, CA',
            lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000),
            isCurrentDevice: false
          }
        ]);
      } catch (error) {
        setError('Failed to load MFA settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadMFAData();
  }, []);

  // Handle MFA toggle
  const handleMFAToggle = async (enabled: boolean) => {
    if (enabled) {
      setDialogState('setup');
    } else {
      setDialogState('verify-disable');
    }
  };

  // Handle MFA setup completion
  const handleSetupComplete = async (backupCodes: string[]) => {
    setIsMFAEnabled(true);
    setDialogState('none');
    onMFAStatusChange?.(true);
    
    // Refresh data
    // In a real app, you'd reload from the API
    setDevices([
      {
        id: '1',
        name: 'Google Authenticator',
        type: 'totp',
        isActive: true,
        lastUsed: new Date(),
        createdAt: new Date()
      }
    ]);
  };

  // Handle MFA disable
  const handleDisableMFA = async () => {
    setIsLoading(true);
    try {
      // Here you would typically call your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsMFAEnabled(false);
      setDevices([]);
      setBackupCodes([]);
      setDialogState('none');
      onMFAStatusChange?.(false);
    } catch (error) {
      setError('Failed to disable MFA');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle backup codes regeneration
  const handleRegenerateBackupCodes = async () => {
    setIsLoading(true);
    try {
      // Here you would typically call your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate new backup codes
      const newCodes = Array.from({ length: 8 }, (_, i) => ({
        id: `new-${i + 1}`,
        code: `${Math.random().toString().slice(2, 7)}-${Math.random().toString().slice(2, 7)}`,
        isUsed: false
      }));
      
      setBackupCodes(newCodes);
      setDialogState('none');
    } catch (error) {
      setError('Failed to regenerate backup codes');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove trusted device
  const handleRemoveTrustedDevice = async (deviceId: string) => {
    try {
      // Here you would typically call your API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTrustedDevices(prev => prev.filter(device => device.id !== deviceId));
    } catch (error) {
      setError('Failed to remove trusted device');
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    const content = [
      'Two-Factor Authentication Backup Codes',
      '==========================================',
      '',
      'Keep these codes safe! Each code can only be used once.',
      'Use these codes if you lose access to your authenticator app.',
      '',
      ...backupCodes.map((item, index) => 
        `${index + 1}. ${item.code}${item.isUsed ? ' (USED)' : ''}`
      ),
      '',
      `Generated on: ${new Date().toLocaleString()}`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get device icon
  const getDeviceIcon = (type: MFADevice['type']) => {
    switch (type) {
      case 'totp':
        return <Smartphone className="h-4 w-4" />;
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      case 'email':
        return <Key className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading MFA settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* MFA Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`rounded-full p-2 ${isMFAEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Shield className={`h-5 w-5 ${isMFAEnabled ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </div>
            </div>
            <Badge variant={isMFAEnabled ? 'default' : 'secondary'}>
              {isMFAEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="mfa-toggle">Enable Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                {isMFAEnabled 
                  ? 'Your account is protected with 2FA'
                  : 'Protect your account with an additional security layer'
                }
              </p>
            </div>
            <Switch
              id="mfa-toggle"
              checked={isMFAEnabled}
              onCheckedChange={handleMFAToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* MFA Devices */}
      {isMFAEnabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Authentication Methods</CardTitle>
                <CardDescription>
                  Manage your authentication devices and methods
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogState('setup')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Method
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(device.type)}
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.lastUsed 
                          ? `Last used ${formatDate(device.lastUsed)}`
                          : 'Never used'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={device.isActive ? 'default' : 'secondary'}>
                      {device.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes */}
      {isMFAEnabled && backupCodes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Backup Codes</CardTitle>
                <CardDescription>
                  Use these codes if you lose access to your authentication device
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadBackupCodes}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogState('regenerate-backup')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded border font-mono text-sm text-center ${
                      item.isUsed 
                        ? 'bg-muted text-muted-foreground line-through' 
                        : 'bg-background'
                    }`}
                  >
                    {item.code}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {backupCodes.filter(code => !code.isUsed).length} of {backupCodes.length} codes remaining
                </span>
                <span>
                  Each code can only be used once
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trusted Devices */}
      {isMFAEnabled && trustedDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trusted Devices</CardTitle>
            <CardDescription>
              Devices where you've chosen to skip 2FA for 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trustedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{device.name}</p>
                        {device.isCurrentDevice && (
                          <Badge variant="outline" className="text-xs">
                            Current Device
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center space-x-4">
                          <span>{device.browser} • {device.os}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{device.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Last seen {formatDate(device.lastSeen)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {!device.isCurrentDevice && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTrustedDevice(device.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <Dialog open={dialogState === 'setup'} onOpenChange={() => setDialogState('none')}>
        <DialogContent className="max-w-md">
          <TOTPSetup
            variant="minimal"
            onSetupComplete={handleSetupComplete}
            onCancel={() => setDialogState('none')}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState === 'verify-disable'} onOpenChange={() => setDialogState('none')}>
        <DialogContent className="max-w-md">
          <TOTPVerification
            title="Verify to Disable 2FA"
            description="Enter your authentication code to disable two-factor authentication"
            variant="minimal"
            showBackupOption={true}
            onVerificationSuccess={handleDisableMFA}
            onBackupCodeUsed={handleDisableMFA}
            onBack={() => setDialogState('none')}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState === 'regenerate-backup'} onOpenChange={() => setDialogState('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              This will invalidate all existing backup codes and generate new ones. 
              Make sure to save the new codes in a safe place.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> All current backup codes will be invalidated and cannot be used anymore.
              </AlertDescription>
            </Alert>
            <div className="flex space-x-2">
              <Button
                onClick={handleRegenerateBackupCodes}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Codes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogState('none')}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MFAManagement;