/**
 * Session Manager
 * 
 * Handles session timeout, warnings, and concurrent session management
 * Features:
 * - Automatic session timeout detection
 * - Warning notifications before timeout
 * - Activity tracking and idle detection
 * - Concurrent session monitoring
 * - Session extension capabilities
 */

import { enhancedApiClient } from './enhanced-api-client';

export interface SessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  checkIntervalSeconds: number;
  maxConcurrentSessions: number;
  trackActivity: boolean;
  autoExtendOnActivity: boolean;
}

export interface SessionInfo {
  isActive: boolean;
  expiresAt: Date | null;
  lastActivity: Date;
  warningShown: boolean;
  concurrentSessions: number;
  sessionId: string;
}

export interface SessionEventHandlers {
  onWarning?: (timeRemaining: number) => void;
  onTimeout?: () => void;
  onConcurrentSession?: (sessionCount: number) => void;
  onSessionExtended?: () => void;
  onActivityDetected?: () => void;
}

class SessionManager {
  private config: SessionConfig;
  private handlers: SessionEventHandlers;
  private sessionInfo: SessionInfo | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private activityListeners: (() => void)[] = [];
  private lastActivityTime: Date = new Date();
  private warningTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<SessionConfig> = {}, handlers: SessionEventHandlers = {}) {
    this.config = {
      timeoutMinutes: 30,
      warningMinutes: 5,
      checkIntervalSeconds: 30,
      maxConcurrentSessions: 3,
      trackActivity: true,
      autoExtendOnActivity: false,
      ...config,
    };
    this.handlers = handlers;
  }

  /**
   * Initialize session monitoring
   */
  public async initialize(): Promise<void> {
    try {
      // Get current session status
      const authStatus = await enhancedApiClient.getAuthStatus();
      
      if (authStatus.isAuthenticated && authStatus.tokenExpiry) {
        this.sessionInfo = {
          isActive: true,
          expiresAt: authStatus.tokenExpiry,
          lastActivity: new Date(),
          warningShown: false,
          concurrentSessions: 1, // This would come from backend
          sessionId: this.generateSessionId(),
        };

        this.startMonitoring();
        
        if (this.config.trackActivity) {
          this.setupActivityTracking();
        }
      }
    } catch (error) {
      console.error('Failed to initialize session manager:', error);
    }
  }

  /**
   * Start session monitoring
   */
  private startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, this.config.checkIntervalSeconds * 1000);

    // Initial check
    this.checkSession();
  }

  /**
   * Check session status and handle timeouts
   */
  private async checkSession(): Promise<void> {
    if (!this.sessionInfo || !this.sessionInfo.expiresAt) {
      return;
    }

    const now = new Date();
    const timeUntilExpiry = this.sessionInfo.expiresAt.getTime() - now.getTime();
    const warningTime = this.config.warningMinutes * 60 * 1000;

    // Check if session has expired
    if (timeUntilExpiry <= 0) {
      this.handleSessionTimeout();
      return;
    }

    // Check if warning should be shown
    if (timeUntilExpiry <= warningTime && !this.sessionInfo.warningShown) {
      this.showSessionWarning(Math.floor(timeUntilExpiry / 1000));
      this.sessionInfo.warningShown = true;
    }

    // Check for concurrent sessions
    await this.checkConcurrentSessions();

    // Auto-extend session if there's recent activity
    if (this.config.autoExtendOnActivity && this.hasRecentActivity()) {
      await this.extendSession();
    }
  }

  /**
   * Show session warning
   */
  private showSessionWarning(timeRemaining: number): void {
    this.handlers.onWarning?.(timeRemaining);

    // Set up countdown for warning
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
    }

    this.warningTimeout = setTimeout(() => {
      this.handleSessionTimeout();
    }, timeRemaining * 1000);
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout(): void {
    this.sessionInfo = null;
    this.stopMonitoring();
    this.handlers.onTimeout?.();
  }

  /**
   * Check for concurrent sessions
   */
  private async checkConcurrentSessions(): Promise<void> {
    try {
      // This would be an API call to check concurrent sessions
      // For now, we'll simulate it
      const sessionCount = 1; // This would come from the API
      
      if (sessionCount > this.config.maxConcurrentSessions) {
        this.handlers.onConcurrentSession?.(sessionCount);
      }

      if (this.sessionInfo) {
        this.sessionInfo.concurrentSessions = sessionCount;
      }
    } catch (error) {
      console.error('Failed to check concurrent sessions:', error);
    }
  }

  /**
   * Extend the current session
   */
  public async extendSession(): Promise<boolean> {
    try {
      await enhancedApiClient.manualRefresh();
      
      // Update session info with new expiry
      const authStatus = await enhancedApiClient.getAuthStatus();
      if (this.sessionInfo && authStatus.tokenExpiry) {
        this.sessionInfo.expiresAt = authStatus.tokenExpiry;
        this.sessionInfo.warningShown = false;
        
        // Clear warning timeout
        if (this.warningTimeout) {
          clearTimeout(this.warningTimeout);
          this.warningTimeout = null;
        }
      }

      this.handlers.onSessionExtended?.();
      return true;
    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    }
  }

  /**
   * Setup activity tracking
   */
  private setupActivityTracking(): void {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      this.lastActivityTime = new Date();
      if (this.sessionInfo) {
        this.sessionInfo.lastActivity = this.lastActivityTime;
      }
      this.handlers.onActivityDetected?.();
    };

    // Throttle activity detection to avoid excessive calls
    let activityTimeout: NodeJS.Timeout | null = null;
    const throttledHandleActivity = () => {
      if (activityTimeout) return;
      
      activityTimeout = setTimeout(() => {
        handleActivity();
        activityTimeout = null;
      }, 1000); // Throttle to once per second
    };

    activityEvents.forEach(event => {
      const listener = () => throttledHandleActivity();
      document.addEventListener(event, listener, true);
      this.activityListeners.push(() => {
        document.removeEventListener(event, listener, true);
      });
    });
  }

  /**
   * Check if there's recent activity
   */
  private hasRecentActivity(): boolean {
    const now = new Date();
    const timeSinceActivity = now.getTime() - this.lastActivityTime.getTime();
    const activityThreshold = 5 * 60 * 1000; // 5 minutes
    
    return timeSinceActivity < activityThreshold;
  }

  /**
   * Stop session monitoring
   */
  private stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }

    // Remove activity listeners
    this.activityListeners.forEach(removeListener => removeListener());
    this.activityListeners = [];
  }

  /**
   * Get current session information
   */
  public getSessionInfo(): SessionInfo | null {
    return this.sessionInfo;
  }

  /**
   * Update session configuration
   */
  public updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring with new config
    if (this.sessionInfo?.isActive) {
      this.startMonitoring();
    }
  }

  /**
   * Update event handlers
   */
  public updateHandlers(newHandlers: Partial<SessionEventHandlers>): void {
    this.handlers = { ...this.handlers, ...newHandlers };
  }

  /**
   * Manually trigger session check
   */
  public async checkNow(): Promise<void> {
    await this.checkSession();
  }

  /**
   * Destroy session manager
   */
  public destroy(): void {
    this.stopMonitoring();
    this.sessionInfo = null;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Force logout all sessions
   */
  public async logoutAllSessions(): Promise<void> {
    try {
      // This would be an API call to logout all sessions
      console.log('Logout all sessions - API call needed');
      this.handleSessionTimeout();
    } catch (error) {
      console.error('Failed to logout all sessions:', error);
    }
  }

  /**
   * Force logout other sessions
   */
  public async logoutOtherSessions(): Promise<void> {
    try {
      // This would be an API call to logout other sessions
      console.log('Logout other sessions - API call needed');
      
      if (this.sessionInfo) {
        this.sessionInfo.concurrentSessions = 1;
      }
    } catch (error) {
      console.error('Failed to logout other sessions:', error);
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Export class for custom instances
export { SessionManager };

// Utility functions
export const createSessionManager = (
  config?: Partial<SessionConfig>,
  handlers?: SessionEventHandlers
): SessionManager => {
  return new SessionManager(config, handlers);
};

export const getTimeUntilExpiry = (expiresAt: Date): number => {
  return Math.max(0, expiresAt.getTime() - Date.now());
};

export const formatTimeRemaining = (milliseconds: number): string => {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};