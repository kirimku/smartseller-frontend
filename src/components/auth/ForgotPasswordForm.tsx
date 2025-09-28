import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Separator } from '../../shared/components/ui/separator';
import { 
  Loader2, 
  Mail, 
  Phone, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import { useAuthenticationFlow } from '../../hooks/useAuthenticationFlow';

export interface ForgotPasswordFormProps {
  title?: string;
  description?: string;
  showPhoneRecovery?: boolean;
  allowBackToLogin?: boolean;
  redirectTo?: string;
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'card';
}

type RecoveryStep = 'input' | 'sent' | 'resend';

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  title = 'Reset Password',
  description = 'Enter your email address and we\'ll send you a link to reset your password',
  showPhoneRecovery = true,
  allowBackToLogin = true,
  redirectTo,
  onSuccess,
  onError,
  className = '',
  variant = 'card'
}) => {
  // Form state
  const [recoveryType, setRecoveryType] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Authentication hook
  const {
    state,
    clearError
  } = useAuthenticationFlow();

  // Cooldown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Form validation
  const validateForm = (): boolean => {
    if (recoveryType === 'email') {
      if (!email.trim()) {
        setError('Email address is required');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address');
        return false;
      }
    } else {
      if (!phone.trim()) {
        setError('Phone number is required');
        return false;
      }
      if (!/^\+?[\d\s-()]+$/.test(phone)) {
        setError('Please enter a valid phone number');
        return false;
      }
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearError();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Here you would typically call a forgot password API
      // For now, we'll simulate the process
      console.log('Password reset request:', {
        recoveryType,
        email: recoveryType === 'email' ? email : undefined,
        phone: recoveryType === 'phone' ? phone : undefined
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setCurrentStep('sent');
      setResendCooldown(60); // 60 second cooldown
      onSuccess?.(recoveryType === 'email' ? email : phone);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset instructions';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend
  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setIsLoading(true);

    try {
      // Simulate resend API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResendCooldown(60);
      setCurrentStep('sent');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend instructions';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to input
  const handleBackToInput = () => {
    setCurrentStep('input');
    setError('');
    clearError();
  };

  // Clear errors when switching recovery types
  useEffect(() => {
    setError('');
    clearError();
  }, [recoveryType, clearError]);

  // Render input step
  const renderInputStep = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {(error || state.error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || state.error}</AlertDescription>
        </Alert>
      )}

      {/* Recovery Type Toggle */}
      {showPhoneRecovery && (
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            type="button"
            variant={recoveryType === 'email' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setRecoveryType('email')}
            disabled={isLoading}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button
            type="button"
            variant={recoveryType === 'phone' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setRecoveryType('phone')}
            disabled={isLoading}
          >
            <Phone className="h-4 w-4 mr-2" />
            Phone
          </Button>
        </div>
      )}

      {/* Email/Phone Input */}
      <div className="space-y-2">
        <Label htmlFor={recoveryType}>
          {recoveryType === 'email' ? 'Email Address' : 'Phone Number'}
        </Label>
        <Input
          id={recoveryType}
          type={recoveryType === 'email' ? 'email' : 'tel'}
          value={recoveryType === 'email' ? email : phone}
          onChange={(e) => {
            if (recoveryType === 'email') {
              setEmail(e.target.value);
            } else {
              setPhone(e.target.value);
            }
          }}
          placeholder={
            recoveryType === 'email' 
              ? 'Enter your email address' 
              : 'Enter your phone number'
          }
          required
          disabled={isLoading}
          className="h-11"
          autoFocus
        />
        <p className="text-sm text-muted-foreground">
          {recoveryType === 'email' 
            ? 'We\'ll send a password reset link to this email address'
            : 'We\'ll send a verification code to this phone number'
          }
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-11"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send Reset Instructions
          </>
        )}
      </Button>

      {/* Back to Login */}
      {allowBackToLogin && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </>
      )}
    </form>
  );

  // Render sent step
  const renderSentStep = () => (
    <div className="space-y-4 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Check your {recoveryType}</h3>
        <p className="text-muted-foreground">
          {recoveryType === 'email' 
            ? `We've sent password reset instructions to ${email}`
            : `We've sent a verification code to ${phone}`
          }
        </p>
      </div>

      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {recoveryType === 'email' 
            ? 'Click the link in the email to reset your password. The link will expire in 24 hours.'
            : 'Enter the verification code you received to continue with password reset.'
          }
        </AlertDescription>
      </Alert>

      {/* Resend Button */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={isLoading || resendCooldown > 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Resending...
            </>
          ) : resendCooldown > 0 ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend in {resendCooldown}s
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Instructions
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Didn't receive the {recoveryType === 'email' ? 'email' : 'code'}? Check your spam folder or try resending.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Back to Input */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={handleBackToInput}
        >
          Try a different {recoveryType === 'email' ? 'email' : 'phone number'}
        </Button>

        {allowBackToLogin && (
          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  // Form content based on current step
  const formContent = currentStep === 'input' ? renderInputStep() : renderSentStep();

  // Render based on variant
  if (variant === 'minimal') {
    return (
      <div className={`space-y-6 ${className}`}>
        {currentStep === 'input' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
        )}
        {formContent}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={`w-full max-w-md ${className}`}>
        {currentStep === 'input' && (
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        )}
        <CardContent className={currentStep === 'input' ? '' : 'pt-6'}>
          {formContent}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={`w-full max-w-md space-y-6 ${className}`}>
      {currentStep === 'input' && (
        <div className="text-center">
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>
      )}
      <Card>
        <CardContent className="pt-6">
          {formContent}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordForm;