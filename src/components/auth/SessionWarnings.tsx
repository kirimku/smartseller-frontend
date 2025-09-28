/**
 * Session Warning Components
 * 
 * Components for displaying session timeout warnings and concurrent session alerts
 */

import React from 'react';
import { Clock, Users, AlertTriangle, Wifi, LogOut, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Progress } from '../../shared/components/ui/progress';
import { useSession } from '../../contexts/SessionContext';

/**
 * Format time remaining in MM:SS format
 */
const formatTimeRemaining = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Session Timeout Warning Modal
 */
export const SessionTimeoutWarning: React.FC = () => {
  const { 
    isSessionWarningVisible, 
    timeRemaining, 
    extendSession, 
    dismissWarning 
  } = useSession();

  if (!isSessionWarningVisible) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const progressPercentage = Math.max(0, (timeRemaining / (5 * 60)) * 100); // Assuming 5-minute warning

  const handleExtendSession = async () => {
    const success = await extendSession();
    if (!success) {
      // Handle extension failure
      console.error('Failed to extend session');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="h-8 w-8 text-yellow-600 animate-pulse" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Session Expiring Soon
          </CardTitle>
          <CardDescription className="text-base">
            Your session will expire in{' '}
            <Badge variant="outline" className="font-mono text-lg px-3 py-1">
              {formatTimeRemaining(timeRemaining)}
            </Badge>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Time remaining</span>
              <span>{minutes > 0 ? `${minutes} min` : 'Less than 1 min'}</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
              // Change color based on time remaining
              style={{
                '--progress-background': timeRemaining < 60 ? '#ef4444' : timeRemaining < 180 ? '#f59e0b' : '#10b981'
              } as React.CSSProperties}
            />
          </div>

          <Alert className={timeRemaining < 60 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
            <AlertTriangle className={`h-4 w-4 ${timeRemaining < 60 ? 'text-red-600' : 'text-yellow-600'}`} />
            <AlertDescription className={timeRemaining < 60 ? 'text-red-800' : 'text-yellow-800'}>
              {timeRemaining < 60 
                ? 'Your session will expire very soon! Please extend it now to avoid losing your work.'
                : 'To continue working, please extend your session or you will be automatically logged out.'
              }
            </AlertDescription>
          </Alert>
          
          <div className="flex space-x-3">
            <Button 
              onClick={handleExtendSession} 
              className="flex-1"
              size="lg"
            >
              <Wifi className="mr-2 h-4 w-4" />
              Extend Session
            </Button>
            <Button 
              onClick={dismissWarning} 
              variant="outline" 
              className="flex-1"
              size="lg"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout Now
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Session will be automatically extended if you continue working
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Concurrent Session Warning Modal
 */
export const ConcurrentSessionWarning: React.FC = () => {
  const { 
    isConcurrentSessionWarningVisible,
    concurrentSessionCount,
    handleConcurrentSessionContinue,
    handleConcurrentSessionLogoutOthers,
    handleConcurrentSessionLogoutAll
  } = useSession();

  if (!isConcurrentSessionWarningVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
            <Users className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Multiple Sessions Detected
          </CardTitle>
          <CardDescription className="text-base">
            You have{' '}
            <Badge variant="outline" className="font-semibold">
              {concurrentSessionCount}
            </Badge>
            {' '}active sessions running simultaneously.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="border-orange-200 bg-orange-50">
            <Shield className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Security Notice:</strong> If you didn't authorize these sessions, 
              please logout all sessions immediately and change your password.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleConcurrentSessionContinue} 
              variant="outline" 
              className="w-full justify-start"
              size="lg"
            >
              <Shield className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Continue with Current Session</div>
                <div className="text-sm text-gray-500">Keep all sessions active</div>
              </div>
            </Button>

            <Button 
              onClick={handleConcurrentSessionLogoutOthers} 
              variant="secondary" 
              className="w-full justify-start"
              size="lg"
            >
              <Users className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Logout Other Sessions</div>
                <div className="text-sm text-gray-500">Keep only this session active</div>
              </div>
            </Button>

            <Button 
              onClick={handleConcurrentSessionLogoutAll} 
              variant="destructive" 
              className="w-full justify-start"
              size="lg"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Logout All Sessions</div>
                <div className="text-sm text-gray-500">Sign out everywhere and start fresh</div>
              </div>
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              For security, we recommend using only one session at a time
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Session Status Indicator (for header/navbar)
 */
export const SessionStatusIndicator: React.FC<{ 
  className?: string;
  showTimeRemaining?: boolean;
}> = ({ 
  className = "",
  showTimeRemaining = false 
}) => {
  const { sessionInfo, timeRemaining, isSessionWarningVisible } = useSession();

  if (!sessionInfo?.isActive) return null;

  const getStatusColor = () => {
    if (isSessionWarningVisible) {
      return timeRemaining < 60 ? 'text-red-600' : 'text-yellow-600';
    }
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (isSessionWarningVisible) {
      return `Expires in ${formatTimeRemaining(timeRemaining)}`;
    }
    return 'Session active';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`h-2 w-2 rounded-full ${
        isSessionWarningVisible 
          ? (timeRemaining < 60 ? 'bg-red-500 animate-pulse' : 'bg-yellow-500 animate-pulse')
          : 'bg-green-500'
      }`} />
      {showTimeRemaining && (
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

/**
 * Combined Session Warnings Component
 */
export const SessionWarnings: React.FC = () => {
  return (
    <>
      <SessionTimeoutWarning />
      <ConcurrentSessionWarning />
    </>
  );
};

export default SessionWarnings;