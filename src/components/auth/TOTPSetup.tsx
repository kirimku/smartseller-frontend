import React, { useState, useEffect } from 'react';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Badge } from '../../shared/components/ui/badge';
import { Separator } from '../../shared/components/ui/separator';
import { 
  Loader2, 
  Shield, 
  Smartphone, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  QrCode,
  Key,
  Download,
  RefreshCw
} from 'lucide-react';

export interface TOTPSetupProps {
  title?: string;
  description?: string;
  onSetupComplete?: (backupCodes: string[]) => void;
  onCancel?: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'card';
}

interface TOTPSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

type SetupStep = 'loading' | 'setup' | 'verify' | 'backup' | 'complete';

export const TOTPSetup: React.FC<TOTPSetupProps> = ({
  title = 'Set Up Two-Factor Authentication',
  description = 'Add an extra layer of security to your account',
  onSetupComplete,
  onCancel,
  className = '',
  variant = 'card'
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<SetupStep>('loading');
  const [setupData, setSetupData] = useState<TOTPSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [downloadedBackupCodes, setDownloadedBackupCodes] = useState(false);

  // Initialize TOTP setup
  useEffect(() => {
    const initializeSetup = async () => {
      try {
        // Here you would typically call your API to generate TOTP setup data
        // For now, we'll simulate the process
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockSetupData: TOTPSetupData = {
          secret: 'JBSWY3DPEHPK3PXP',
          qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          backupCodes: [
            '12345-67890',
            '23456-78901',
            '34567-89012',
            '45678-90123',
            '56789-01234',
            '67890-12345',
            '78901-23456',
            '89012-34567'
          ],
          manualEntryKey: 'JBSW Y3DP EHPK 3PXP'
        };

        setSetupData(mockSetupData);
        setCurrentStep('setup');
      } catch (error) {
        setError('Failed to initialize TOTP setup');
        setCurrentStep('setup');
      }
    };

    initializeSetup();
  }, []);

  // Handle verification
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Here you would typically verify the TOTP code with your API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate verification
      if (verificationCode === '123456') {
        setCurrentStep('backup');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle setup completion
  const handleCompleteSetup = async () => {
    setIsLoading(true);

    try {
      // Here you would typically finalize the TOTP setup with your API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentStep('complete');
      onSetupComplete?.(setupData?.backupCodes || []);
    } catch (error) {
      setError('Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const content = [
      'Two-Factor Authentication Backup Codes',
      '==========================================',
      '',
      'Keep these codes safe! Each code can only be used once.',
      'Use these codes if you lose access to your authenticator app.',
      '',
      ...setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`),
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

    setDownloadedBackupCodes(true);
  };

  // Render loading step
  const renderLoadingStep = () => (
    <div className="flex flex-col items-center space-y-4 text-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div>
        <h3 className="text-lg font-semibold">Setting up Two-Factor Authentication</h3>
        <p className="text-muted-foreground">Please wait while we prepare your setup...</p>
      </div>
    </div>
  );

  // Render setup step
  const renderSetupStep = () => (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Step 1: Install an Authenticator App</h3>
        <p className="text-muted-foreground">
          Download and install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
        </p>
      </div>

      {/* QR Code */}
      <div className="space-y-4">
        <h4 className="font-medium">Step 2: Scan QR Code</h4>
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg border">
            {setupData?.qrCodeUrl ? (
              <img 
                src={setupData.qrCodeUrl} 
                alt="TOTP QR Code" 
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 bg-muted flex items-center justify-center">
                <QrCode className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Scan this QR code with your authenticator app
        </p>
      </div>

      {/* Manual Entry */}
      <div className="space-y-3">
        <h4 className="font-medium">Can't scan? Enter manually</h4>
        <div className="space-y-2">
          <Label htmlFor="manual-key">Secret Key</Label>
          <div className="flex space-x-2">
            <Input
              id="manual-key"
              value={setupData?.manualEntryKey || ''}
              readOnly
              className="font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(setupData?.secret || '', 'secret')}
              className="px-3"
            >
              {copiedSecret ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter this key manually in your authenticator app
          </p>
        </div>
      </div>

      {/* Next Button */}
      <Button
        onClick={() => setCurrentStep('verify')}
        className="w-full"
      >
        I've Added the Account
      </Button>
    </div>
  );

  // Render verify step
  const renderVerifyStep = () => (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Step 3: Verify Setup</h3>
        <p className="text-muted-foreground">
          Enter the 6-digit code from your authenticator app to verify the setup.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Verification Code Input */}
      <div className="space-y-2">
        <Label htmlFor="verification-code">Verification Code</Label>
        <Input
          id="verification-code"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="text-center text-lg tracking-widest font-mono"
          maxLength={6}
          autoFocus
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {/* Verify Button */}
      <Button
        onClick={handleVerifyCode}
        className="w-full"
        disabled={isLoading || verificationCode.length !== 6}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Verify and Continue
          </>
        )}
      </Button>

      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => setCurrentStep('setup')}
        className="w-full"
        disabled={isLoading}
      >
        Back to Setup
      </Button>
    </div>
  );

  // Render backup codes step
  const renderBackupStep = () => (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Step 4: Save Backup Codes</h3>
        <p className="text-muted-foreground">
          Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
        </p>
      </div>

      {/* Warning */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Each backup code can only be used once. Store them securely and don't share them with anyone.
        </AlertDescription>
      </Alert>

      {/* Backup Codes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Backup Codes</Label>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(setupData?.backupCodes.join('\n') || '', 'backup')}
            >
              {copiedBackupCodes ? (
                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadBackupCodes}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
          {setupData?.backupCodes.map((code, index) => (
            <div
              key={index}
              className="font-mono text-sm p-2 bg-background rounded border text-center"
            >
              {code}
            </div>
          ))}
        </div>
      </div>

      {/* Completion Button */}
      <Button
        onClick={handleCompleteSetup}
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Completing Setup...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            I've Saved My Backup Codes
          </>
        )}
      </Button>
    </div>
  );

  // Render complete step
  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Two-Factor Authentication Enabled</h3>
        <p className="text-muted-foreground">
          Your account is now protected with two-factor authentication. You'll need your authenticator app to sign in.
        </p>
      </div>

      {/* Status Badge */}
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <Shield className="h-3 w-3 mr-1" />
        2FA Enabled
      </Badge>

      {/* Next Steps */}
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          <strong>Next time you sign in:</strong> You'll be asked for a code from your authenticator app after entering your password.
        </AlertDescription>
      </Alert>
    </div>
  );

  // Get current step content
  const getStepContent = () => {
    switch (currentStep) {
      case 'loading':
        return renderLoadingStep();
      case 'setup':
        return renderSetupStep();
      case 'verify':
        return renderVerifyStep();
      case 'backup':
        return renderBackupStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderLoadingStep();
    }
  };

  const stepContent = getStepContent();

  // Progress indicator
  const getStepNumber = () => {
    switch (currentStep) {
      case 'loading':
      case 'setup':
        return 1;
      case 'verify':
        return 2;
      case 'backup':
        return 3;
      case 'complete':
        return 4;
      default:
        return 1;
    }
  };

  // Render based on variant
  if (variant === 'minimal') {
    return (
      <div className={`space-y-6 ${className}`}>
        {currentStep !== 'complete' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground mt-2">{description}</p>
            {currentStep !== 'loading' && (
              <div className="flex justify-center mt-4">
                <Badge variant="outline">
                  Step {getStepNumber()} of 4
                </Badge>
              </div>
            )}
          </div>
        )}
        {stepContent}
        {currentStep !== 'complete' && currentStep !== 'loading' && onCancel && (
          <div className="text-center">
            <Button variant="ghost" onClick={onCancel}>
              Cancel Setup
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={`w-full max-w-md ${className}`}>
        {currentStep !== 'complete' && (
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            {currentStep !== 'loading' && (
              <Badge variant="outline" className="mx-auto">
                Step {getStepNumber()} of 4
              </Badge>
            )}
          </CardHeader>
        )}
        <CardContent className={currentStep === 'complete' ? 'pt-6' : ''}>
          {stepContent}
          {currentStep !== 'complete' && currentStep !== 'loading' && onCancel && (
            <>
              <Separator className="my-4" />
              <div className="text-center">
                <Button variant="ghost" onClick={onCancel} size="sm">
                  Cancel Setup
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={`w-full max-w-md space-y-6 ${className}`}>
      {currentStep !== 'complete' && (
        <div className="text-center">
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-2">{description}</p>
          {currentStep !== 'loading' && (
            <Badge variant="outline" className="mt-4">
              Step {getStepNumber()} of 4
            </Badge>
          )}
        </div>
      )}
      <Card>
        <CardContent className="pt-6">
          {stepContent}
          {currentStep !== 'complete' && currentStep !== 'loading' && onCancel && (
            <>
              <Separator className="my-4" />
              <div className="text-center">
                <Button variant="ghost" onClick={onCancel} size="sm">
                  Cancel Setup
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TOTPSetup;