import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Checkbox } from '../../shared/components/ui/checkbox';
import { Separator } from '../../shared/components/ui/separator';
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  Shield, 
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useAuthenticationFlow, type LoginCredentials, type PhoneLoginCredentials } from '../../hooks/useAuthenticationFlow';

export interface LoginFormProps {
  title?: string;
  description?: string;
  showPhoneLogin?: boolean;
  showGoogleLogin?: boolean;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'card';
}

export const LoginForm: React.FC<LoginFormProps> = ({
  title = 'Sign In',
  description = 'Enter your credentials to access your account',
  showPhoneLogin = true,
  showGoogleLogin = true,
  showRememberMe = true,
  showForgotPassword = true,
  redirectTo,
  onSuccess,
  onError,
  className = '',
  variant = 'card'
}) => {
  // Form state
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  // Authentication hook
  const {
    state,
    loginWithEmail,
    loginWithPhone,
    loginWithGoogle,
    clearError,
    retry
  } = useAuthenticationFlow();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      let result;
      
      if (loginType === 'email') {
        const credentials: LoginCredentials = {
          email,
          password,
          rememberMe,
          captchaToken: showCaptcha ? captchaToken : undefined
        };
        result = await loginWithEmail(credentials);
      } else {
        const credentials: PhoneLoginCredentials = {
          phone,
          password,
          rememberMe,
          captchaToken: showCaptcha ? captchaToken : undefined
        };
        result = await loginWithPhone(credentials);
      }

      if (result.success) {
        onSuccess?.();
      } else {
        // Handle specific error cases
        if (result.requiresCaptcha) {
          setShowCaptcha(true);
        }
        onError?.(result.error || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      onError?.(errorMessage);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        onSuccess?.();
      } else {
        onError?.(result.error || 'Google login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google login failed';
      onError?.(errorMessage);
    }
  };

  // Handle retry
  const handleRetry = async () => {
    try {
      const result = await retry();
      if (result.success) {
        onSuccess?.();
      }
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  // Clear error when switching login types
  useEffect(() => {
    clearError();
  }, [loginType, clearError]);

  // Form content
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{state.error}</span>
            {state.canRetry && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                disabled={state.isLoading}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Login Type Toggle */}
      {showPhoneLogin && (
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            type="button"
            variant={loginType === 'email' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setLoginType('email')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button
            type="button"
            variant={loginType === 'phone' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setLoginType('phone')}
          >
            <Phone className="h-4 w-4 mr-2" />
            Phone
          </Button>
        </div>
      )}

      {/* Email/Phone Input */}
      <div className="space-y-2">
        <Label htmlFor={loginType}>
          {loginType === 'email' ? 'Email Address' : 'Phone Number'}
        </Label>
        <Input
          id={loginType}
          type={loginType === 'email' ? 'email' : 'tel'}
          value={loginType === 'email' ? email : phone}
          onChange={(e) => {
            if (loginType === 'email') {
              setEmail(e.target.value);
            } else {
              setPhone(e.target.value);
            }
          }}
          placeholder={loginType === 'email' ? 'Enter your email' : 'Enter your phone number'}
          required
          disabled={state.isLoading}
          className="h-11"
        />
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={state.isLoading}
            className="h-11 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={state.isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Captcha Input (if required) */}
      {showCaptcha && (
        <div className="space-y-2">
          <Label htmlFor="captcha">Security Verification</Label>
          <div className="flex space-x-2">
            <Input
              id="captcha"
              type="text"
              value={captchaToken}
              onChange={(e) => setCaptchaToken(e.target.value)}
              placeholder="Enter captcha code"
              required
              disabled={state.isLoading}
              className="h-11"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="px-3"
              disabled={state.isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Please complete the security verification to continue.
          </p>
        </div>
      )}

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        {showRememberMe && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={state.isLoading}
            />
            <Label
              htmlFor="remember"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Remember me
            </Label>
          </div>
        )}
        
        {showForgotPassword && (
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-11"
        disabled={state.isLoading}
      >
        {state.isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Sign In
          </>
        )}
      </Button>

      {/* Google Login */}
      {showGoogleLogin && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={handleGoogleLogin}
            disabled={state.isLoading}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </>
      )}
    </form>
  );

  // Render based on variant
  if (variant === 'minimal') {
    return (
      <div className={`space-y-6 ${className}`}>
        {title && (
          <div className="text-center">
            <h2 className="text-2xl font-bold">{title}</h2>
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
        )}
        {formContent}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={`w-full max-w-md ${className}`}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={`w-full max-w-md space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          {formContent}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;