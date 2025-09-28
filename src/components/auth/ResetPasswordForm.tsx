import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Progress } from '../../shared/components/ui/progress';
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Shield,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';
import { useAuthenticationFlow } from '../../hooks/useAuthenticationFlow';

export interface ResetPasswordFormProps {
  title?: string;
  description?: string;
  token?: string;
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'card';
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

type ResetStep = 'form' | 'success' | 'expired' | 'invalid';

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  title = 'Reset Your Password',
  description = 'Enter your new password below',
  token: propToken,
  redirectTo = '/login',
  onSuccess,
  onError,
  className = '',
  variant = 'card'
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<ResetStep>('form');
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  // Get token from props or URL params
  const token = propToken || searchParams.get('token') || '';

  // Validation state
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  // Authentication hook
  const {
    state,
    clearError
  } = useAuthenticationFlow();

  // Password strength calculation
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One special character');
    }

    return {
      score,
      feedback,
      isValid: score >= 4
    };
  };

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, feedback: [], isValid: false });
    }
  }, [password]);

  // Check if passwords match
  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [password, confirmPassword]);

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setCurrentStep('invalid');
        setIsValidatingToken(false);
        return;
      }

      try {
        // Here you would typically validate the token with your API
        // For now, we'll simulate the validation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate token validation logic
        if (token === 'expired') {
          setCurrentStep('expired');
        } else if (token === 'invalid') {
          setCurrentStep('invalid');
        } else {
          setCurrentStep('form');
        }
      } catch (error) {
        setCurrentStep('invalid');
        setError('Failed to validate reset token');
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  // Form validation
  const validateForm = (): boolean => {
    if (!password) {
      setError('Password is required');
      return false;
    }

    if (!passwordStrength.isValid) {
      setError('Password does not meet security requirements');
      return false;
    }

    if (!confirmPassword) {
      setError('Please confirm your password');
      return false;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return false;
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
      // Here you would typically call a reset password API
      // For now, we'll simulate the process
      console.log('Password reset:', {
        token,
        password
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setCurrentStep('success');
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle redirect to login
  const handleGoToLogin = () => {
    navigate(redirectTo);
  };

  // Password strength indicator
  const getPasswordStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 1) return 'Weak';
    if (score <= 2) return 'Fair';
    if (score <= 3) return 'Good';
    if (score <= 4) return 'Strong';
    return 'Very Strong';
  };

  // Render loading state
  if (isValidatingToken) {
    return (
      <Card className={`w-full max-w-md ${className}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Validating Reset Link</h3>
              <p className="text-muted-foreground">Please wait while we verify your reset token...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render form step
  const renderFormStep = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {(error || state.error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || state.error}</AlertDescription>
        </Alert>
      )}

      {/* Password Input */}
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your new password"
            required
            disabled={isLoading}
            className="h-11 pr-10"
            autoFocus
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        
        {/* Password Strength Indicator */}
        {password && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Progress 
                value={(passwordStrength.score / 5) * 100} 
                className="flex-1 h-2"
              />
              <span className={`text-sm font-medium ${
                passwordStrength.isValid ? 'text-green-600' : 'text-orange-600'
              }`}>
                {getPasswordStrengthText(passwordStrength.score)}
              </span>
            </div>
            {passwordStrength.feedback.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <p>Password must include:</p>
                <ul className="list-none space-y-1 mt-1">
                  {passwordStrength.feedback.map((item, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <X className="h-3 w-3 text-red-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            required
            disabled={isLoading}
            className="h-11 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        
        {confirmPassword && !passwordsMatch && (
          <p className="text-sm text-red-500 flex items-center">
            <X className="h-3 w-3 mr-1" />
            Passwords do not match
          </p>
        )}
        
        {confirmPassword && passwordsMatch && (
          <p className="text-sm text-green-600 flex items-center">
            <Check className="h-3 w-3 mr-1" />
            Passwords match
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-11"
        disabled={isLoading || !passwordStrength.isValid || !passwordsMatch}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Resetting Password...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Reset Password
          </>
        )}
      </Button>

      {/* Back to Login */}
      <div className="text-center">
        <Link 
          to="/login" 
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Login
        </Link>
      </div>
    </form>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="space-y-4 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Password Reset Successful</h3>
        <p className="text-muted-foreground">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
      </div>

      {/* Go to Login Button */}
      <Button
        onClick={handleGoToLogin}
        className="w-full h-11"
      >
        Continue to Login
      </Button>
    </div>
  );

  // Render expired step
  const renderExpiredStep = () => (
    <div className="space-y-4 text-center">
      {/* Error Icon */}
      <div className="flex justify-center">
        <div className="rounded-full bg-red-100 p-3">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
      </div>

      {/* Error Message */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Reset Link Expired</h3>
        <p className="text-muted-foreground">
          This password reset link has expired. Please request a new one to reset your password.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          onClick={() => navigate('/forgot-password')}
          className="w-full h-11"
        >
          Request New Reset Link
        </Button>
        
        <Button
          variant="outline"
          onClick={handleGoToLogin}
          className="w-full h-11"
        >
          Back to Login
        </Button>
      </div>
    </div>
  );

  // Render invalid step
  const renderInvalidStep = () => (
    <div className="space-y-4 text-center">
      {/* Error Icon */}
      <div className="flex justify-center">
        <div className="rounded-full bg-red-100 p-3">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
      </div>

      {/* Error Message */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Invalid Reset Link</h3>
        <p className="text-muted-foreground">
          This password reset link is invalid or has already been used. Please request a new one.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          onClick={() => navigate('/forgot-password')}
          className="w-full h-11"
        >
          Request New Reset Link
        </Button>
        
        <Button
          variant="outline"
          onClick={handleGoToLogin}
          className="w-full h-11"
        >
          Back to Login
        </Button>
      </div>
    </div>
  );

  // Get form content based on current step
  const getFormContent = () => {
    switch (currentStep) {
      case 'form':
        return renderFormStep();
      case 'success':
        return renderSuccessStep();
      case 'expired':
        return renderExpiredStep();
      case 'invalid':
        return renderInvalidStep();
      default:
        return renderFormStep();
    }
  };

  const formContent = getFormContent();

  // Render based on variant
  if (variant === 'minimal') {
    return (
      <div className={`space-y-6 ${className}`}>
        {currentStep === 'form' && (
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
        {currentStep === 'form' && (
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        )}
        <CardContent className={currentStep === 'form' ? '' : 'pt-6'}>
          {formContent}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={`w-full max-w-md space-y-6 ${className}`}>
      {currentStep === 'form' && (
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

export default ResetPasswordForm;