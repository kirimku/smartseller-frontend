import React, { createContext, useContext } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContextType, UserRole } from '../contexts/AuthContext'
import { vi } from 'vitest'

// Create a mock AuthContext for testing
const MockAuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock AuthProvider that accepts a value prop
const MockAuthProvider: React.FC<{ children: React.ReactNode; value: AuthContextType }> = ({ children, value }) => {
  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  )
}

// Mock AuthContext
export const createMockAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  login: vi.fn(),
  loginWithPhone: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  getGoogleLoginUrl: vi.fn(),
  handleGoogleCallback: vi.fn(),
  hasRole: vi.fn(),
  hasPermission: vi.fn(),
  clearError: vi.fn(),
  ...overrides,
})

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'customer' as UserRole,
  isEmailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Mock authenticated user context
export const mockAuthenticatedContext = createMockAuthContext({
  user: mockUser,
  isAuthenticated: true,
  hasRole: vi.fn((role: UserRole) => role === 'customer'),
  hasPermission: vi.fn(() => true),
})

// Mock unauthenticated user context
export const mockUnauthenticatedContext = createMockAuthContext({
  user: null,
  isAuthenticated: false,
})

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authContext?: AuthContextType
  initialEntries?: string[]
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    authContext = mockUnauthenticatedContext,
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MockAuthProvider value={authContext}>
            {children}
          </MockAuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock form data
export const mockFormData = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!',
  name: 'Test User',
  phone: '+1234567890',
}

// Mock API responses
export const mockApiResponses = {
  loginSuccess: {
    user: mockUser,
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
  },
  loginError: {
    message: 'Invalid credentials',
    code: 'INVALID_CREDENTIALS',
  },
  registerSuccess: {
    user: { ...mockUser, isEmailVerified: false },
    message: 'Registration successful. Please verify your email.',
  },
  forgotPasswordSuccess: {
    message: 'Password reset email sent successfully',
  },
  resetPasswordSuccess: {
    message: 'Password reset successfully',
  },
}

// Mock navigation
export const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock useAuthenticationFlow hook
export const mockUseAuthenticationFlow = {
  login: vi.fn(),
  register: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  hasRole: vi.fn(),
  hasPermission: vi.fn(),
  isLoading: false,
  error: null,
  success: null,
  clearMessages: vi.fn(),
}

// Reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks()
  mockNavigate.mockClear()
  Object.values(mockUseAuthenticationFlow).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockClear()
    }
  })
}