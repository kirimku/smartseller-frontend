import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPasswordForm from '../ResetPasswordForm'
import { renderWithProviders, mockUnauthenticatedContext } from '../../../test/utils'

// Mock the authentication flow hook
const mockResetPassword = vi.fn()
const mockValidateResetToken = vi.fn()
vi.mock('../../../hooks/useAuthenticationFlow', () => ({
  useAuthenticationFlow: () => ({
    resetPassword: mockResetPassword,
    validateResetToken: mockValidateResetToken,
    isLoading: false,
    error: null,
  }),
}))

describe('ResetPasswordForm', () => {
  const user = userEvent.setup()
  const mockToken = 'valid-reset-token'

  beforeEach(() => {
    vi.clearAllMocks()
    mockResetPassword.mockResolvedValue({ success: true })
    mockValidateResetToken.mockResolvedValue({ valid: true })
  })

  it('renders reset password form', () => {
    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByText(/reset password/i)).toBeInTheDocument()
    expect(screen.getByText(/enter your new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
  })

  it('renders with custom title and description', () => {
    renderWithProviders(
      <ResetPasswordForm 
        token={mockToken}
        title="Create New Password"
        description="Choose a strong password for your account"
      />,
      { authContext: mockUnauthenticatedContext }
    )

    expect(screen.getByText('Create New Password')).toBeInTheDocument()
    expect(screen.getByText('Choose a strong password for your account')).toBeInTheDocument()
  })

  it('validates token on mount', async () => {
    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    await waitFor(() => {
      expect(mockValidateResetToken).toHaveBeenCalledWith(mockToken)
    })
  })

  it('shows error for invalid token', async () => {
    mockValidateResetToken.mockResolvedValue({ valid: false, error: 'Token expired' })

    renderWithProviders(<ResetPasswordForm token="invalid-token" />, {
      authContext: mockUnauthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/token expired/i)).toBeInTheDocument()
      expect(screen.getByText(/request a new reset link/i)).toBeInTheDocument()
    })
  })

  it('validates password fields', async () => {
    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    const submitButton = screen.getByRole('button', { name: /reset password/i })
    
    // Try to submit without passwords
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    // Enter passwords that don't match
    const passwordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'DifferentPassword123!')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('validates password strength', async () => {
    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })
    
    // Enter weak password
    await user.type(passwordInput, 'weak')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPassword123!')
    await user.type(confirmPasswordInput, 'NewPassword123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: mockToken,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      })
    })
  })

  it('shows success message after successful reset', async () => {
    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPassword123!')
    await user.type(confirmPasswordInput, 'NewPassword123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password reset successful/i)).toBeInTheDocument()
      expect(screen.getByText(/you can now log in/i)).toBeInTheDocument()
    })
  })

  it('shows error message on reset failure', async () => {
    mockResetPassword.mockRejectedValue(new Error('Reset failed'))

    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPassword123!')
    await user.type(confirmPasswordInput, 'NewPassword123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/reset failed/i)).toBeInTheDocument()
    })
  })

  it('calls onSuccess callback after successful reset', async () => {
    const onSuccess = vi.fn()
    
    renderWithProviders(<ResetPasswordForm token={mockToken} onSuccess={onSuccess} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPassword123!')
    await user.type(confirmPasswordInput, 'NewPassword123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({
        message: 'Password reset successfully',
      })
    })
  })

  it('calls onError callback on reset failure', async () => {
    const onError = vi.fn()
    const error = new Error('Network error')
    mockResetPassword.mockRejectedValue(error)
    
    renderWithProviders(<ResetPasswordForm token={mockToken} onError={onError} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPassword123!')
    await user.type(confirmPasswordInput, 'NewPassword123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error)
    })
  })

  it('shows loading state during submission', async () => {
    mockResetPassword.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )

    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPassword123!')
    await user.type(confirmPasswordInput, 'NewPassword123!')
    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByRole('button', { name: /resetting/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/password reset successful/i)).toBeInTheDocument()
    })
  })

  it('disables form during loading', async () => {
    mockResetPassword.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )

    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPassword123!')
    await user.type(confirmPasswordInput, 'NewPassword123!')
    await user.click(submitButton)

    // Form should be disabled during loading
    expect(passwordInput).toBeDisabled()
    expect(confirmPasswordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('shows password strength indicator', async () => {
    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    
    await user.type(passwordInput, 'weak')
    // Password strength indicator should be visible
    expect(screen.getByText(/password strength/i)).toBeInTheDocument()

    await user.clear(passwordInput)
    await user.type(passwordInput, 'StrongPassword123!')
    // Should show stronger password indication
    expect(screen.getByText(/password strength/i)).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Click to show password
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Click to hide password again
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('supports different variants', () => {
    const { rerender } = renderWithProviders(<ResetPasswordForm token={mockToken} variant="card" />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByTestId('reset-password-form')).toHaveClass('card')

    rerender(<ResetPasswordForm token={mockToken} variant="minimal" />)

    expect(screen.getByTestId('reset-password-form')).toHaveClass('minimal')
  })

  it('applies custom className', () => {
    renderWithProviders(<ResetPasswordForm token={mockToken} className="custom-class" />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByTestId('reset-password-form')).toHaveClass('custom-class')
  })

  it('handles keyboard navigation', async () => {
    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    // Tab through form elements
    await user.tab()
    expect(passwordInput).toHaveFocus()

    await user.tab()
    expect(confirmPasswordInput).toHaveFocus()

    await user.tab()
    expect(submitButton).toHaveFocus()

    // Enter key should submit form
    await user.type(passwordInput, 'NewPassword123!')
    await user.type(confirmPasswordInput, 'NewPassword123!')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalled()
    })
  })

  it('provides accessibility attributes', () => {
    renderWithProviders(<ResetPasswordForm token={mockToken} />, {
      authContext: mockUnauthenticatedContext,
    })

    const form = screen.getByRole('form')
    expect(form).toHaveAttribute('aria-label', 'Reset password form')

    const passwordInput = screen.getByLabelText(/^new password$/i)
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('autocomplete', 'new-password')
    expect(passwordInput).toHaveAttribute('required')

    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password')
    expect(confirmPasswordInput).toHaveAttribute('required')
  })

  it('redirects to login after successful reset', async () => {
    const mockNavigate = vi.fn()
    vi.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
    }))

    renderWithProviders(<ResetPasswordForm token={mockToken} redirectTo="/login" />, {
      authContext: mockUnauthenticatedContext,
    })

    const passwordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPassword123!')
    await user.type(confirmPasswordInput, 'NewPassword123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password reset successful/i)).toBeInTheDocument()
    })

    // Should redirect after a delay
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    }, { timeout: 3000 })
  })
})