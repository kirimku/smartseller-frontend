import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  Key,
  Clock
} from 'lucide-react';

export interface TOTPVerificationProps {
  title?: string;
  description?: string;
  userEmail?: string;
  onVerificationSuccess?: (code: string) => void;
  onBackupCodeUsed?: (code: string) => void;
  onBack?: () => void;
  onResendCode?: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'card';
  showBackupOption?: boolean;
  autoFocus?: boolean;
  maxAttempts?: number;
}

type VerificationMode = 'totp' | 'backup';

export const TOTPVerification: React.FC<TOTPVerificationProps> = ({
  title = 'Two-Factor Authentication',
  description = 'Enter the code from your authenticator app',
  userEmail,
  onVerificationSuccess,
  onBackupCodeUsed,
  onBack,
  onResendCode,
  className = '',
  variant = 'card',
  showBackupOption = true,
  autoFocus = true,
  maxAttempts = 5
}) => {
  // State
  const [mode, setMode] = useState<VerificationMode>('totp');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, mode]);

  // Timer for TOTP refresh
  useEffect(() => {
    if (mode === 'totp') {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            return 30; // Reset to 30 seconds
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [mode]);

  // Handle code input
  const handleCodeChange = (value: string) => {
    if (mode === 'totp') {
      // Only allow digits for TOTP
      const digits = value.replace(/\D/g, '').slice(0, 6);
      setCode(digits);
    } else {
      // Allow alphanumeric for backup codes
      const formatted = value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 11);
      setCode(formatted);
    }
    setError('');
  };

  // Handle verification
  const handleVerify = async () => {
    if (!code.trim()) {
      setError(mode === 'totp' ? 'Please enter the 6-digit code' : 'Please enter the backup code');
      return;
    }

    if (mode === 'totp' && code.length !== 6) {
      setError('TOTP code must be 6 digits');
      return;
    }

    if (mode === 'backup' && code.length < 5) {
      setError('Backup code is too short');
      return;
    }

    if (attempts >= maxAttempts) {
      setError('Too many failed attempts. Please try again later.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Here you would typically verify the code with your API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate verification
      const isValid = mode === 'totp' ? code === '123456' : code === '12345-67890';
      
      if (isValid) {
        if (mode === 'totp') {
          onVerificationSuccess?.(code);
        } else {
          onBackupCodeUsed?.(code);
        }
      } else {
        setAttempts(prev => prev + 1);
        const remainingAttempts = maxAttempts - attempts - 1;
        
        if (remainingAttempts > 0) {
          setError(`Invalid ${mode === 'totp' ? 'code' : 'backup code'}. ${remainingAttempts} attempts remaining.`);
        } else {
          setError('Too many failed attempts. Please try again later.');
        }
        setCode('');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleVerify();
    }
  };

  // Handle resend (for future SMS/Email backup)
  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onResendCode?.();
      setCanResend(false);
      setTimeRemaining(30);
    } catch (error) {
      setError('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch between modes
  const switchMode = (newMode: VerificationMode) => {
    setMode(newMode);
    setCode('');
    setError('');
    setAttempts(0);
  };

  // Get progress color for timer
  const getTimerColor = () => {
    if (timeRemaining > 20) return 'text-green-600';
    if (timeRemaining > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Render TOTP input
  const renderTOTPInput = () => (
    <div className="space-y-4">
      {/* Timer */}
      <div className="flex items-center justify-center space-x-2 text-sm">
        <Clock className="h-4 w-4" />
        <span className={`font-mono ${getTimerColor()}`}>
          {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:
          {String(timeRemaining % 60).padStart(2, '0')}
        </span>
        <span className="text-muted-foreground">until next code</span>
      </div>

      {/* Code Input */}
      <div className="space-y-2">
        <Label htmlFor="totp-code">Authentication Code</Label>
        <Input
          ref={inputRef}
          id="totp-code"
          type="text"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="123456"
          className="text-center text-xl tracking-widest font-mono"
          maxLength={6}
          disabled={isLoading}
          autoComplete="one-time-code"
        />
        <p className="text-sm text-muted-foreground text-center">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>
    </div>
  );

  // Render backup code input
  const renderBackupInput = () => (
    <div className="space-y-4">
      {/* Instructions */}
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          Enter one of your backup codes. Each code can only be used once.
        </AlertDescription>
      </Alert>

      {/* Code Input */}
      <div className="space-y-2">
        <Label htmlFor="backup-code">Backup Code</Label>
        <Input
          ref={inputRef}
          id="backup-code"
          type="text"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="12345-67890"
          className="text-center text-lg tracking-wider font-mono"
          maxLength={11}
          disabled={isLoading}
          autoComplete="one-time-code"
        />
        <p className="text-sm text-muted-foreground text-center">
          Format: XXXXX-XXXXX
        </p>
      </div>
    </div>
  );

  // Main content
  const renderContent = () => (
    <div className="space-y-6">
      {/* User Info */}
      {userEmail && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Signing in as <span className="font-medium">{userEmail}</span>
          </p>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={mode === 'totp' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => switchMode('totp')}
          className="flex-1"
          disabled={isLoading}
        >
          <Smartphone className="h-4 w-4 mr-2" />
          Authenticator App
        </Button>
        {showBackupOption && (
          <Button
            variant={mode === 'backup' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => switchMode('backup')}
            className="flex-1"
            disabled={isLoading}
          >
            <Key className="h-4 w-4 mr-2" />
            Backup Code
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input Section */}
      {mode === 'totp' ? renderTOTPInput() : renderBackupInput()}

      {/* Verify Button */}
      <Button
        onClick={handleVerify}
        className="w-full"
        disabled={
          isLoading || 
          !code.trim() || 
          (mode === 'totp' && code.length !== 6) ||
          attempts >= maxAttempts
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Verify Code
          </>
        )}
      </Button>

      {/* Additional Options */}
      <div className="space-y-3">
        {/* Resend Option (for future use) */}
        {onResendCode && mode === 'totp' && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={!canResend || isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Code
            </Button>
          </div>
        )}

        {/* Back Button */}
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        )}
      </div>

      {/* Attempts Warning */}
      {attempts > 0 && attempts < maxAttempts && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {maxAttempts - attempts} verification attempts remaining
          </AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Having trouble? Contact support for assistance.
        </p>
      </div>
    </div>
  );

  // Render based on variant
  if (variant === 'minimal') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>
        {renderContent()}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={`w-full max-w-md ${className}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={`w-full max-w-md space-y-6 ${className}`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default TOTPVerification;