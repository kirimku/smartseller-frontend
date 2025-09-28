import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotPasswordForm from '../ForgotPasswordForm'
import { renderWithProviders, mockUnauthenticatedContext } from '../../../test/utils'

// Mock the authentication flow hook
const mockRequestPasswordReset = vi.fn()
vi.mock('../../../hooks/useAuthenticationFlow', () => ({
  useAuthenticationFlow: () => ({
    requestPasswordReset: mockRequestPasswordReset,
    isLoading: false,
    error: null,
  }),
}))

describe('ForgotPasswordForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequestPasswordReset.mockResolvedValue({ success: true })
  })

  it('renders forgot password form', () => {
    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    expect(screen.getByText(/enter your email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('renders with custom title and description', () => {
    renderWithProviders(
      <ForgotPasswordForm 
        title="Reset Your Password"
        description="We'll send you a secure link to reset your password"
      />,
      { authContext: mockUnauthenticatedContext }
    )

    expect(screen.getByText('Reset Your Password')).toBeInTheDocument()
    expect(screen.getByText("We'll send you a secure link to reset your password")).toBeInTheDocument()
  })

  it('validates email field', async () => {
    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    // Try to submit without email
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })

    // Enter invalid email
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid email', async () => {
    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({
        email: 'test@example.com',
      })
    })
  })

  it('shows success message after successful submission', async () => {
    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/reset link sent/i)).toBeInTheDocument()
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
  })

  it('shows error message on submission failure', async () => {
    mockRequestPasswordReset.mockRejectedValue(new Error('User not found'))

    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'nonexistent@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument()
    })
  })

  it('calls onSuccess callback after successful submission', async () => {
    const onSuccess = vi.fn()
    
    renderWithProviders(<ForgotPasswordForm onSuccess={onSuccess} />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({
        email: 'test@example.com',
        message: 'Password reset link sent successfully',
      })
    })
  })

  it('calls onError callback on submission failure', async () => {
    const onError = vi.fn()
    const error = new Error('Network error')
    mockRequestPasswordReset.mockRejectedValue(error)
    
    renderWithProviders(<ForgotPasswordForm onError={onError} />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error)
    })
  })

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    mockRequestPasswordReset.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )

    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/reset link sent/i)).toBeInTheDocument()
    })
  })

  it('disables form during loading', async () => {
    mockRequestPasswordReset.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )

    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    // Form should be disabled during loading
    expect(emailInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('renders back to login link', () => {
    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByText(/back to login/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
  })

  it('supports different variants', () => {
    const { rerender } = renderWithProviders(<ForgotPasswordForm variant="card" />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByTestId('forgot-password-form')).toHaveClass('card')

    rerender(<ForgotPasswordForm variant="minimal" />)

    expect(screen.getByTestId('forgot-password-form')).toHaveClass('minimal')
  })

  it('applies custom className', () => {
    renderWithProviders(<ForgotPasswordForm className="custom-class" />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByTestId('forgot-password-form')).toHaveClass('custom-class')
  })

  it('handles keyboard navigation', async () => {
    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    // Tab to email input
    await user.tab()
    expect(emailInput).toHaveFocus()

    // Tab to submit button
    await user.tab()
    expect(submitButton).toHaveFocus()

    // Enter key should submit form
    await user.type(emailInput, 'test@example.com')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalled()
    })
  })

  it('clears form after successful submission', async () => {
    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/reset link sent/i)).toBeInTheDocument()
    })

    // Form should be cleared
    expect(emailInput).toHaveValue('')
  })

  it('allows resending reset link', async () => {
    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    // First submission
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/reset link sent/i)).toBeInTheDocument()
    })

    // Should show resend option
    const resendButton = screen.getByRole('button', { name: /resend link/i })
    await user.click(resendButton)

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledTimes(2)
    })
  })

  it('provides accessibility attributes', () => {
    renderWithProviders(<ForgotPasswordForm />, {
      authContext: mockUnauthenticatedContext,
    })

    const form = screen.getByRole('form')
    expect(form).toHaveAttribute('aria-label', 'Forgot password form')

    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('autocomplete', 'email')
    expect(emailInput).toHaveAttribute('required')
  })
})