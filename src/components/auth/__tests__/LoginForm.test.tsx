import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '../LoginForm'
import { renderWithProviders, mockUnauthenticatedContext, resetAllMocks } from '../../../test/utils'

// Mock the useAuthenticationFlow hook
const mockUseAuthenticationFlow = {
  state: {
    isLoading: false,
    isAuthenticating: false,
    isRefreshing: false,
    error: null,
    lastError: null,
    retryCount: 0,
    canRetry: true,
  },
  user: null,
  isAuthenticated: false,
  loginWithEmail: vi.fn(),
  loginWithPhone: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
  refreshSession: vi.fn(),
  validateSession: vi.fn(),
  extendSession: vi.fn(),
  clearError: vi.fn(),
  retry: vi.fn(),
  hasRole: vi.fn(),
  hasPermission: vi.fn(),
  getAuthHeaders: vi.fn(),
  checkSecurityStatus: vi.fn(),
}

vi.mock('../../../hooks/useAuthenticationFlow', () => ({
  useAuthenticationFlow: () => mockUseAuthenticationFlow,
}))

describe('LoginForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    resetAllMocks()
    mockUseAuthenticationFlow.loginWithEmail.mockClear()
    mockUseAuthenticationFlow.loginWithGoogle.mockClear()
    mockUseAuthenticationFlow.clearError.mockClear()
    mockUseAuthenticationFlow.state.isLoading = false
    mockUseAuthenticationFlow.state.error = null
    mockUseAuthenticationFlow.state.isAuthenticating = false
  })

  it('renders login form with all elements', () => {
    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    expect(mockUseAuthenticationFlow.loginWithEmail).not.toHaveBeenCalled()
  })

  it('validates email format', async () => {
    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })

    expect(mockUseAuthenticationFlow.loginWithEmail).not.toHaveBeenCalled()
  })

  it('validates password minimum length', async () => {
    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })

    expect(mockUseAuthenticationFlow.loginWithEmail).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    mockUseAuthenticationFlow.loginWithEmail.mockResolvedValue({ success: true })

    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUseAuthenticationFlow.loginWithEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      })
    })
  })

  it('handles phone number login', async () => {
    mockUseAuthenticationFlow.loginWithEmail.mockResolvedValue({ success: true })

    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, '+1234567890')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUseAuthenticationFlow.loginWithEmail).toHaveBeenCalledWith({
        email: '+1234567890',
        password: 'password123',
        rememberMe: false,
      })
    })
  })

  it('handles remember me checkbox', async () => {
    mockUseAuthenticationFlow.loginWithEmail.mockResolvedValue({ success: true })

    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(rememberMeCheckbox)
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUseAuthenticationFlow.loginWithEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      })
    })
  })

  it('handles Google login', async () => {
    mockUseAuthenticationFlow.loginWithGoogle.mockResolvedValue({ 
      success: true, 
      data: 'https://google.com/oauth' 
    })

    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await user.click(googleButton)

    await waitFor(() => {
      expect(mockUseAuthenticationFlow.loginWithGoogle).toHaveBeenCalled()
    })
  })

  it('displays loading state during submission', async () => {
    mockUseAuthenticationFlow.state.isLoading = true

    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const submitButton = screen.getByRole('button', { name: /signing in/i })
    expect(submitButton).toBeDisabled()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('displays error messages', () => {
    mockUseAuthenticationFlow.state.error = 'Invalid credentials'

    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('clears error when form is modified', async () => {
    mockUseAuthenticationFlow.state.error = 'Invalid credentials'

    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    expect(mockUseAuthenticationFlow.clearError).toHaveBeenCalled()
  })

  it('toggles password visibility', async () => {
    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })

    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('shows forgot password link when enabled', () => {
    renderWithProviders(<LoginForm showForgotPassword={true} />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
  })

  it('hides forgot password link when disabled', () => {
    renderWithProviders(<LoginForm showForgotPassword={false} />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.queryByText(/forgot your password/i)).not.toBeInTheDocument()
  })

  it('supports different variants', () => {
    const { rerender } = renderWithProviders(<LoginForm variant="card" />, {
      authContext: mockUnauthenticatedContext,
    })

    // Card variant should render with card wrapper
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()

    rerender(<LoginForm variant="minimal" />)
    // Minimal variant should still render the form
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    renderWithProviders(<LoginForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.tab()
    expect(passwordInput).toHaveFocus()

    await user.type(passwordInput, 'password123')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockUseAuthenticationFlow.loginWithEmail).toHaveBeenCalled()
    })
  })
})