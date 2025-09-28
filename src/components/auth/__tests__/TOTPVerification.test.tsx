import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TOTPVerification from '../TOTPVerification'
import { renderWithProviders, mockUnauthenticatedContext } from '../../../test/utils'

// Mock the MFA hooks
const mockVerifyTOTP = vi.fn()
const mockVerifyBackupCode = vi.fn()
vi.mock('../../../hooks/useMFA', () => ({
  useMFA: () => ({
    verifyTOTP: mockVerifyTOTP,
    verifyBackupCode: mockVerifyBackupCode,
    isLoading: false,
    error: null,
  }),
}))

describe('TOTPVerification', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyTOTP.mockResolvedValue({ success: true, token: 'auth-token' })
    mockVerifyBackupCode.mockResolvedValue({ success: true, token: 'auth-token' })
  })

  it('renders TOTP verification form', () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
    expect(screen.getByText(/enter the verification code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
  })

  it('renders with custom title and description', () => {
    renderWithProviders(
      <TOTPVerification 
        title="Verify Your Identity"
        description="Please enter your 6-digit authentication code"
      />,
      { authContext: mockUnauthenticatedContext }
    )

    expect(screen.getByText('Verify Your Identity')).toBeInTheDocument()
    expect(screen.getByText('Please enter your 6-digit authentication code')).toBeInTheDocument()
  })

  it('validates verification code input', async () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const verifyButton = screen.getByRole('button', { name: /verify/i })
    
    // Try to submit without code
    await user.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/verification code is required/i)).toBeInTheDocument()
    })

    // Enter invalid code length
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123')
    await user.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/code must be 6 digits/i)).toBeInTheDocument()
    })
  })

  it('submits TOTP verification', async () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(mockVerifyTOTP).toHaveBeenCalledWith('123456')
    })
  })

  it('calls onVerificationSuccess callback after successful verification', async () => {
    const onVerificationSuccess = vi.fn()
    
    renderWithProviders(<TOTPVerification onVerificationSuccess={onVerificationSuccess} />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(onVerificationSuccess).toHaveBeenCalledWith('123456')
    })
  })

  it('shows error message on verification failure', async () => {
    mockVerifyTOTP.mockRejectedValue(new Error('Invalid code'))

    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument()
    })
  })

  it('handles verification failure', async () => {
    const error = new Error('Network error')
    mockVerifyTOTP.mockRejectedValue(error)
    
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(mockVerifyTOTP).toHaveBeenCalledWith('123456')
    })
  })

  it('shows loading state during verification', async () => {
    mockVerifyTOTP.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, token: 'auth-token' }), 100))
    )

    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    // Should show loading state
    expect(screen.getByRole('button', { name: /verifying/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(mockVerifyTOTP).toHaveBeenCalled()
    })
  })

  it('disables form during loading', async () => {
    mockVerifyTOTP.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, token: 'auth-token' }), 100))
    )

    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    // Form should be disabled during loading
    expect(codeInput).toBeDisabled()
    expect(verifyButton).toBeDisabled()
  })

  it('shows backup code option', () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByText(/can't access your authenticator/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /use backup code/i })).toBeInTheDocument()
  })

  it('switches to backup code mode', async () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const backupCodeButton = screen.getByRole('button', { name: /use backup code/i })
    await user.click(backupCodeButton)

    expect(screen.getByText(/enter backup code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/backup code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify backup code/i })).toBeInTheDocument()
  })

  it('validates backup code input', async () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const backupCodeButton = screen.getByRole('button', { name: /use backup code/i })
    await user.click(backupCodeButton)

    const verifyButton = screen.getByRole('button', { name: /verify backup code/i })
    
    // Try to submit without code
    await user.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/backup code is required/i)).toBeInTheDocument()
    })

    // Enter invalid code length
    const codeInput = screen.getByLabelText(/backup code/i)
    await user.type(codeInput, '123')
    await user.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/backup code must be 6 digits/i)).toBeInTheDocument()
    })
  })

  it('submits backup code verification', async () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const backupCodeButton = screen.getByRole('button', { name: /use backup code/i })
    await user.click(backupCodeButton)

    const codeInput = screen.getByLabelText(/backup code/i)
    const verifyButton = screen.getByRole('button', { name: /verify backup code/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(mockVerifyBackupCode).toHaveBeenCalledWith('123456')
    })
  })

  it('switches back to TOTP mode from backup code', async () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const backupCodeButton = screen.getByRole('button', { name: /use backup code/i })
    await user.click(backupCodeButton)

    expect(screen.getByText(/enter backup code/i)).toBeInTheDocument()

    const totpButton = screen.getByRole('button', { name: /use authenticator app/i })
    await user.click(totpButton)

    expect(screen.getByText(/enter the verification code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
  })

  it('renders TOTP form elements', () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
  })

  it('renders code input field', () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    expect(codeInput).toBeInTheDocument()
  })

  it('renders verification component', () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByTestId('totp-verification')).toBeInTheDocument()
  })

  it('renders with default styling', () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    expect(screen.getByTestId('totp-verification')).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })
    const backupCodeButton = screen.getByRole('button', { name: /use backup code/i })

    // Tab through form elements
    await user.tab()
    expect(codeInput).toHaveFocus()

    await user.tab()
    expect(verifyButton).toHaveFocus()

    await user.tab()
    expect(backupCodeButton).toHaveFocus()

    // Enter key should submit form
    await user.type(codeInput, '123456')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockVerifyTOTP).toHaveBeenCalled()
    })
  })

  it('clears form after successful verification', async () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(mockVerifyTOTP).toHaveBeenCalled()
    })

    // Form should be cleared
    expect(codeInput).toHaveValue('')
  })

  it('allows retry after failed verification', async () => {
    mockVerifyTOTP.mockRejectedValueOnce(new Error('Invalid code'))
    mockVerifyTOTP.mockResolvedValueOnce({ success: true, token: 'auth-token' })

    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    // First attempt - should fail
    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument()
    })

    // Second attempt - should succeed
    await user.clear(codeInput)
    await user.type(codeInput, '654321')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(mockVerifyTOTP).toHaveBeenCalledTimes(2)
    })
  })

  it('provides accessibility attributes', () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const form = screen.getByRole('form')
    expect(form).toHaveAttribute('aria-label', 'Two-factor authentication verification')

    const codeInput = screen.getByLabelText(/verification code/i)
    expect(codeInput).toHaveAttribute('type', 'text')
    expect(codeInput).toHaveAttribute('inputmode', 'numeric')
    expect(codeInput).toHaveAttribute('pattern', '[0-9]*')
    expect(codeInput).toHaveAttribute('maxlength', '6')
    expect(codeInput).toHaveAttribute('required')
  })

  it('handles paste events for code input', async () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    
    // Simulate paste event
    await user.click(codeInput)
    await user.paste('123456')

    expect(codeInput).toHaveValue('123456')
  })

  it('formats code input correctly', async () => {
    renderWithProviders(<TOTPVerification />, {
      authContext: mockUnauthenticatedContext,
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    
    // Should only accept numeric input
    await user.type(codeInput, 'abc123def456')
    expect(codeInput).toHaveValue('123456')
  })
})