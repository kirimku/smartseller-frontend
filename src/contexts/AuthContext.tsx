import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UserRole = 'platform_admin' | 'tenant_admin' | 'customer' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string; // Only for tenant_admin and customer
  avatar?: string;
  permissions?: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  tenantId?: string;
}

interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock API functions - in real implementation, these would call actual APIs
const mockApi = {
  async login(email: string, password: string, role?: UserRole): Promise<LoginResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data based on role
    let mockUser: User;
    
    if (email === 'platform@smartseller.com' && password === 'admin123') {
      mockUser = {
        id: '1',
        email: 'platform@smartseller.com',
        name: 'Platform Admin',
        role: 'platform_admin',
        permissions: ['platform:read', 'platform:write', 'tenants:manage'],
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: new Date().toISOString(),
      };
    } else if (email === 'admin@gaming-pro.com' && password === 'tenant123') {
      mockUser = {
        id: '2',
        email: 'admin@gaming-pro.com',
        name: 'John Smith',
        role: 'tenant_admin',
        tenantId: 'gaming-pro-store',
        permissions: ['tenant:read', 'tenant:write', 'products:manage', 'orders:manage'],
        createdAt: '2024-02-01T00:00:00Z',
        lastLoginAt: new Date().toISOString(),
      };
    } else if (email === 'customer@example.com' && password === 'customer123') {
      mockUser = {
        id: '3',
        email: 'customer@example.com',
        name: 'Jane Doe',
        role: 'customer',
        tenantId: 'gaming-pro-store',
        permissions: ['orders:view', 'profile:edit'],
        createdAt: '2024-03-01T00:00:00Z',
        lastLoginAt: new Date().toISOString(),
      };
    } else {
      throw new Error('Invalid credentials');
    }
    
    return {
      user: mockUser,
      token: 'mock-jwt-token-' + mockUser.id,
      refreshToken: 'mock-refresh-token-' + mockUser.id,
    };
  },

  async register(userData: RegisterData): Promise<LoginResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      tenantId: userData.tenantId,
      permissions: userData.role === 'customer' ? ['orders:view', 'profile:edit'] : 
                   userData.role === 'tenant_admin' ? ['tenant:read', 'tenant:write'] :
                   ['platform:read'],
      createdAt: new Date().toISOString(),
    };
    
    return {
      user: newUser,
      token: 'mock-jwt-token-' + newUser.id,
      refreshToken: 'mock-refresh-token-' + newUser.id,
    };
  },

  async refreshToken(): Promise<LoginResponse> {
    // In real implementation, use refresh token to get new access token
    const storedUser = localStorage.getItem('smartseller_user');
    if (!storedUser) throw new Error('No stored user');
    
    return {
      user: JSON.parse(storedUser),
      token: 'refreshed-token-' + Date.now(),
      refreshToken: 'refreshed-refresh-token-' + Date.now(),
    };
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('smartseller_token');
        const storedUser = localStorage.getItem('smartseller_user');
        
        if (storedToken && storedUser) {
          // In real implementation, validate token with backend
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid stored data
        localStorage.removeItem('smartseller_token');
        localStorage.removeItem('smartseller_user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mockApi.login(email, password, role);
      
      // Store auth data
      localStorage.setItem('smartseller_token', response.token);
      localStorage.setItem('smartseller_refresh_token', response.refreshToken);
      localStorage.setItem('smartseller_user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mockApi.register(userData);
      
      // Store auth data
      localStorage.setItem('smartseller_token', response.token);
      localStorage.setItem('smartseller_refresh_token', response.refreshToken);
      localStorage.setItem('smartseller_user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Clear stored data
      localStorage.removeItem('smartseller_token');
      localStorage.removeItem('smartseller_refresh_token');
      localStorage.removeItem('smartseller_user');
      
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const response = await mockApi.refreshToken();
      
      localStorage.setItem('smartseller_token', response.token);
      localStorage.setItem('smartseller_refresh_token', response.refreshToken);
      localStorage.setItem('smartseller_user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh user');
      // If refresh fails, logout user
      await logout();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    register,
    hasRole,
    hasPermission,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};