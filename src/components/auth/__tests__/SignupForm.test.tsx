import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignupForm from '../SignupForm'
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

describe('SignupForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    resetAllMocks()
    mockUseAuthenticationFlow.loginWithGoogle.mockClear()
    mockUseAuthenticationFlow.clearError.mockClear()
    mockUseAuthenticationFlow.state.isLoading = false
    mockUseAuthenticationFlow.state.error = null
  })

  it('renders signup form with all elements', () => {
    renderWithProviders(<SignupForm />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.getByText('Sign up to get started with your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    renderWithProviders(<SignupForm requireTermsAcceptance={false} />, {
      authContext: mockUnauthenticatedContext,
    })

    // Fill in password fields to enable the submit button
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    
    await user.type(passwordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')
    
    // Wait for password validation to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    // Try to submit the form with empty required fields (but valid password)
    await user.click(submitButton)

    // Check if validation errors appear for required fields
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
      expect(screen.getByText('Last name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Form validation prevents submission
  })

  it('validates email format', async () => {
    renderWithProviders(<SignupForm requireTermsAcceptance={false} />, {
      authContext: mockUnauthenticatedContext,
    })

    // Fill in required fields and valid password to enable submit button
    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')
    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')

    // Wait for password validation to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('validates password strength', async () => {
    renderWithProviders(<SignupForm requireTermsAcceptance={false} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^password$/i)
    
    // Type a weak password
    await user.type(passwordInput, 'weak')

    // Wait for password validation to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that the submit button is disabled due to weak password
    const submitButton = screen.getByRole('button', { name: /create account/i })
    expect(submitButton).toBeDisabled()

    // Check that password strength feedback is shown
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('validates password confirmation', async () => {
    renderWithProviders(<SignupForm requireTermsAcceptance={false} />, {
      authContext: mockUnauthenticatedContext,
    })

    // Fill in required fields
    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'StrongPassword123!')
    await user.type(confirmPasswordInput, 'DifferentPassword123!')

    // Wait for password validation to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })

    // Form validation prevents submission
  })

  it('requires terms acceptance', async () => {
    renderWithProviders(<SignupForm requireTermsAcceptance={true} />, {
      authContext: mockUnauthenticatedContext,
    })

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(firstNameInput, 'Test')
    await user.type(lastNameInput, 'User')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/you must accept the terms/i)).toBeInTheDocument()
    })

    // Form validation prevents submission
  })

  it('submits form with valid data', async () => {
    const mockOnSuccess = vi.fn()
    
    renderWithProviders(<SignupForm onSuccess={mockOnSuccess} />, {
      authContext: mockUnauthenticatedContext,
    })

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')
    await user.type(emailInput, 'john.doe@example.com')
    await user.type(passwordInput, 'StrongPassword123!')
    await user.type(confirmPasswordInput, 'StrongPassword123!')
    
    // Accept terms and conditions
    const termsCheckbox = screen.getByRole('checkbox', { name: /i agree to the terms/i })
    await user.click(termsCheckbox)
    
    await user.click(submitButton)

    // The form simulates signup process
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('handles phone number registration', async () => {
    const mockOnSuccess = vi.fn()

    renderWithProviders(<SignupForm showPhoneSignup={true} onSuccess={mockOnSuccess} />, {
      authContext: mockUnauthenticatedContext,
    })

    // Switch to phone signup
    const phoneButton = screen.getByRole('button', { name: /phone/i })
    await user.click(phoneButton)

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const phoneInput = screen.getByLabelText(/phone number/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')
    await user.type(phoneInput, '+1234567890')
    await user.type(passwordInput, 'StrongPassword123!')
    await user.type(confirmPasswordInput, 'StrongPassword123!')
    
    // Accept terms and conditions
    const termsCheckbox = screen.getByRole('checkbox', { name: /i agree to the terms/i })
    await user.click(termsCheckbox)
    
    await user.click(submitButton)

    // The form simulates signup process
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('handles Google signup', async () => {
    mockUseAuthenticationFlow.loginWithGoogle.mockResolvedValue({ 
      success: true, 
      data: 'https://google.com/oauth' 
    })

    renderWithProviders(<SignupForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await user.click(googleButton)

    await waitFor(() => {
      expect(mockUseAuthenticationFlow.loginWithGoogle).toHaveBeenCalled()
    })
  })

  it('displays password strength indicator', async () => {
    renderWithProviders(<SignupForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^password$/i)
    
    await user.type(passwordInput, 'weak')
    // Password strength indicator should show weak strength
    expect(screen.getByText(/weak/i)).toBeInTheDocument()

    await user.clear(passwordInput)
    await user.type(passwordInput, 'StrongPassword123!')
    // Should show stronger password indication
    expect(screen.getByText(/strong/i)).toBeInTheDocument()
  })

  it('displays loading state during submission', async () => {
    mockUseAuthenticationFlow.state.isLoading = true

    renderWithProviders(<SignupForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const submitButton = screen.getByRole('button', { name: /creating account/i })
    expect(submitButton).toBeDisabled()
  })

  it('displays error messages', () => {
    mockUseAuthenticationFlow.state.error = 'Email already exists'

    renderWithProviders(<SignupForm />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByText('Email already exists')).toBeInTheDocument()
  })



  it('clears error when form is modified', async () => {
    mockUseAuthenticationFlow.state.error = 'Email already exists'

    renderWithProviders(<SignupForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const firstNameInput = screen.getByLabelText(/first name/i)
    await user.type(firstNameInput, 'Test User')

    expect(mockUseAuthenticationFlow.clearError).toHaveBeenCalled()
  })

  it('toggles password visibility', async () => {
    renderWithProviders(<SignupForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^password$/i)
    const toggleButtons = screen.getAllByRole('button', { name: /toggle password visibility/i })

    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(toggleButtons[0])
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(toggleButtons[0])
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('supports different variants', () => {
    const { rerender } = renderWithProviders(<SignupForm variant="card" />, {
      authContext: mockUnauthenticatedContext,
    })

    // Card variant should render with card wrapper (CardTitle renders as h3)
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()

    rerender(<SignupForm variant="minimal" />)
    // Minimal variant should still render the form
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    renderWithProviders(<SignupForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    await user.type(firstNameInput, 'John')
    await user.tab()
    expect(lastNameInput).toHaveFocus()

    await user.type(lastNameInput, 'Doe')
    await user.tab()
    expect(emailInput).toHaveFocus()

    await user.type(emailInput, 'john.doe@example.com')
    await user.tab()
    expect(passwordInput).toHaveFocus()

    await user.type(passwordInput, 'StrongPassword123!')
    await user.tab()
    // Tab again to skip the password visibility toggle button
    await user.tab()
    expect(confirmPasswordInput).toHaveFocus()
  })

  it('validates name minimum length', async () => {
    renderWithProviders(<SignupForm requireTermsAcceptance={false} />, {
      authContext: mockUnauthenticatedContext,
    })

    // Fill in required fields with valid data except first name
    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    await user.type(firstNameInput, 'A') // Too short
    await user.type(lastNameInput, 'Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')

    // Wait for password validation to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument()
    })
  })
})