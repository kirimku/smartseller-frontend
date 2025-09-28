import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TOTPSetup from '../TOTPSetup'
import { renderWithProviders, mockAuthenticatedContext } from '../../../test/utils'

// Mock QR code generation
vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockqrcode'),
}))

// Mock the MFA hooks
const mockGenerateTOTPSecret = vi.fn()
const mockVerifyTOTPSetup = vi.fn()
const mockEnableMFA = vi.fn()
vi.mock('../../../hooks/useMFA', () => ({
  useMFA: () => ({
    generateTOTPSecret: mockGenerateTOTPSecret,
    verifyTOTPSetup: mockVerifyTOTPSetup,
    enableMFA: mockEnableMFA,
    isLoading: false,
    error: null,
  }),
}))

describe('TOTPSetup', () => {
  const user = userEvent.setup()
  const mockSecretData = {
    secret: 'JBSWY3DPEHPK3PXP',
    qrCodeUrl: 'otpauth://totp/SmartSeller:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=SmartSeller',
    backupCodes: ['123456', '789012', '345678', '901234', '567890'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateTOTPSecret.mockResolvedValue(mockSecretData)
    mockVerifyTOTPSetup.mockResolvedValue({ success: true })
    mockEnableMFA.mockResolvedValue({ success: true })
  })

  it('renders TOTP setup wizard', async () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    expect(screen.getByText(/set up two-factor authentication/i)).toBeInTheDocument()
    expect(screen.getByText(/step 1/i)).toBeInTheDocument()
    expect(screen.getByText(/install authenticator app/i)).toBeInTheDocument()
  })

  it('shows step 1: Install authenticator app', () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    expect(screen.getByText(/install an authenticator app/i)).toBeInTheDocument()
    expect(screen.getByText(/google authenticator/i)).toBeInTheDocument()
    expect(screen.getByText(/authy/i)).toBeInTheDocument()
    expect(screen.getByText(/microsoft authenticator/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('progresses to step 2: Scan QR code', async () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(mockGenerateTOTPSecret).toHaveBeenCalled()
      expect(screen.getByText(/step 2/i)).toBeInTheDocument()
      expect(screen.getByText(/scan qr code/i)).toBeInTheDocument()
    })
  })

  it('displays QR code and manual entry option', async () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(screen.getByAltText(/qr code/i)).toBeInTheDocument()
      expect(screen.getByText(/can't scan/i)).toBeInTheDocument()
      expect(screen.getByText(/enter manually/i)).toBeInTheDocument()
    })
  })

  it('shows manual entry when requested', async () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      const manualEntryButton = screen.getByRole('button', { name: /enter manually/i })
      return user.click(manualEntryButton)
    })

    expect(screen.getByText(/manual entry/i)).toBeInTheDocument()
    expect(screen.getByText(mockSecretData.secret)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy secret/i })).toBeInTheDocument()
  })

  it('copies secret to clipboard', async () => {
    const mockWriteText = vi.fn()
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    })

    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      const manualEntryButton = screen.getByRole('button', { name: /enter manually/i })
      return user.click(manualEntryButton)
    })

    const copyButton = screen.getByRole('button', { name: /copy secret/i })
    await user.click(copyButton)

    expect(mockWriteText).toHaveBeenCalledWith(mockSecretData.secret)
    expect(screen.getByText(/copied/i)).toBeInTheDocument()
  })

  it('progresses to step 3: Verify setup', async () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    // Go to step 2
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      return user.click(nextButton)
    })

    expect(screen.getByText(/step 3/i)).toBeInTheDocument()
    expect(screen.getByText(/verify setup/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
  })

  it('validates verification code', async () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    // Navigate to step 3
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      return user.click(nextButton)
    })

    const verifyButton = screen.getByRole('button', { name: /verify/i })
    
    // Try to verify without code
    await user.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/verification code is required/i)).toBeInTheDocument()
    })

    // Enter invalid code
    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '123')
    await user.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/code must be 6 digits/i)).toBeInTheDocument()
    })
  })

  it('verifies TOTP code successfully', async () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    // Navigate to step 3
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      return user.click(nextButton)
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(mockVerifyTOTPSetup).toHaveBeenCalledWith({
        secret: mockSecretData.secret,
        code: '123456',
      })
    })
  })

  it('shows step 4: Backup codes after successful verification', async () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    // Navigate through all steps
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      return user.click(nextButton)
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(screen.getByText(/step 4/i)).toBeInTheDocument()
      expect(screen.getByText(/backup codes/i)).toBeInTheDocument()
      expect(screen.getByText(/save these codes/i)).toBeInTheDocument()
    })
  })

  it('displays backup codes', async () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    // Navigate to backup codes step
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      return user.click(nextButton)
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      mockSecretData.backupCodes.forEach(code => {
        expect(screen.getByText(code)).toBeInTheDocument()
      })
    })
  })

  it('downloads backup codes', async () => {
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    const mockRevokeObjectURL = vi.fn()
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    // Navigate to backup codes step
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      return user.click(nextButton)
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      const downloadButton = screen.getByRole('button', { name: /download codes/i })
      return user.click(downloadButton)
    })

    expect(mockCreateObjectURL).toHaveBeenCalled()
  })

  it('completes setup successfully', async () => {
    const onSetupComplete = vi.fn()
    
    renderWithProviders(<TOTPSetup onSetupComplete={onSetupComplete} />, {
      authContext: mockAuthenticatedContext,
    })

    // Navigate through all steps
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      return user.click(nextButton)
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      const finishButton = screen.getByRole('button', { name: /finish setup/i })
      return user.click(finishButton)
    })

    await waitFor(() => {
      expect(mockEnableMFA).toHaveBeenCalled()
      expect(onSetupComplete).toHaveBeenCalledWith(mockSecretData.backupCodes)
    })
  })

  it('handles setup errors', async () => {
    mockVerifyTOTPSetup.mockRejectedValue(new Error('Invalid code'))
    
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    // Navigate to verification step
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      return user.click(nextButton)
    })

    const codeInput = screen.getByLabelText(/verification code/i)
    const verifyButton = screen.getByRole('button', { name: /verify/i })

    await user.type(codeInput, '123456')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument()
    })
  })

  it('allows going back to previous steps', async () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    // Go to step 2
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument()
    })

    // Go back to step 1
    const backButton = screen.getByRole('button', { name: /back/i })
    await user.click(backButton)

    expect(screen.getByText(/step 1/i)).toBeInTheDocument()
    expect(screen.getByText(/install authenticator app/i)).toBeInTheDocument()
  })

  it('shows loading states', async () => {
    mockGenerateTOTPSecret.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockSecretData), 100))
    )

    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    // Should show loading state
    expect(screen.getByText(/generating/i)).toBeInTheDocument()
    expect(continueButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument()
    })
  })

  it('supports canceling setup', async () => {
    const onCancel = vi.fn()
    
    renderWithProviders(<TOTPSetup onCancel={onCancel} />, {
      authContext: mockAuthenticatedContext,
    })

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(onCancel).toHaveBeenCalled()
  })

  it('provides accessibility attributes', () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    const wizard = screen.getByRole('dialog')
    expect(wizard).toHaveAttribute('aria-label', 'TOTP Setup Wizard')

    const progressIndicator = screen.getByRole('progressbar')
    expect(progressIndicator).toHaveAttribute('aria-valuenow', '1')
    expect(progressIndicator).toHaveAttribute('aria-valuemax', '4')
  })

  it('handles keyboard navigation', async () => {
    renderWithProviders(<TOTPSetup />, {
      authContext: mockAuthenticatedContext,
    })

    const continueButton = screen.getByRole('button', { name: /continue/i })
    
    // Tab to continue button
    await user.tab()
    expect(continueButton).toHaveFocus()

    // Enter key should activate button
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument()
    })
  })
})