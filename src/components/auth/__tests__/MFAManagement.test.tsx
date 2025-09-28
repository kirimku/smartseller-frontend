import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MFAManagement from '../MFAManagement'
import { renderWithProviders, mockAuthenticatedContext } from '../../../test/utils'

// Mock the MFA hooks
const mockGetMFAStatus = vi.fn()
const mockDisableMFA = vi.fn()
const mockRegenerateBackupCodes = vi.fn()
const mockRemoveTrustedDevice = vi.fn()
vi.mock('../../../hooks/useMFA', () => ({
  useMFA: () => ({
    getMFAStatus: mockGetMFAStatus,
    disableMFA: mockDisableMFA,
    regenerateBackupCodes: mockRegenerateBackupCodes,
    removeTrustedDevice: mockRemoveTrustedDevice,
    isLoading: false,
    error: null,
  }),
}))

// Mock child components
interface MockTOTPSetupProps {
  onSetupComplete?: (backupCodes: string[]) => void
  onCancel?: () => void
}

interface MockTOTPVerificationProps {
  onVerificationSuccess?: (code: string) => void
  onBackupCodeUsed?: (code: string) => void
  onBack?: () => void
}

vi.mock('../TOTPSetup', () => ({
  default: ({ onSetupComplete, onCancel }: MockTOTPSetupProps) => (
    <div data-testid="totp-setup">
      <button onClick={() => onSetupComplete?.(['code1', 'code2'])}>Complete Setup</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

vi.mock('../TOTPVerification', () => ({
  default: ({ onVerificationSuccess, onBackupCodeUsed, onBack }: MockTOTPVerificationProps) => (
    <div data-testid="totp-verification">
      <button onClick={() => onVerificationSuccess?.('123456')}>Verify Success</button>
      <button onClick={() => onBackupCodeUsed?.('backup123')}>Use Backup Code</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}))

describe('MFAManagement', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMFAStatus.mockResolvedValue({
      enabled: true,
      devices: [
        {
          id: '1',
          name: 'Google Authenticator',
          type: 'totp',
          isActive: true,
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ],
      backupCodes: [
        { id: '1', code: '12345-67890', isUsed: false },
        { id: '2', code: '23456-78901', isUsed: true, usedAt: new Date() },
        { id: '3', code: '34567-89012', isUsed: false }
      ],
      trustedDevices: [
        {
          id: '1',
          name: 'MacBook Pro',
          browser: 'Chrome 120.0',
          os: 'macOS 14.0',
          location: 'San Francisco, CA',
          lastSeen: new Date(),
          isCurrentDevice: true
        }
      ]
    })
  })

  it('renders MFA management interface', async () => {
    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/add an extra layer of security/i)).toBeInTheDocument()
    expect(screen.getByText(/enabled/i)).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    expect(screen.getByText(/loading mfa settings/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays MFA devices when enabled', async () => {
    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/google authenticator/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/active/i)).toBeInTheDocument()
    expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument()
  })

  it('displays backup codes section', async () => {
    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/backup codes/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/use these codes if you lose access/i)).toBeInTheDocument()
    expect(screen.getByText('12345-67890')).toBeInTheDocument()
    expect(screen.getByText('34567-89012')).toBeInTheDocument()
    expect(screen.getByText(/2 of 3 codes remaining/i)).toBeInTheDocument()
  })

  it('shows used backup codes with strikethrough', async () => {
    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      const usedCode = screen.getByText('23456-78901')
      expect(usedCode).toBeInTheDocument()
      expect(usedCode.closest('div')).toHaveClass('line-through')
    })
  })

  it('allows downloading backup codes', async () => {
    // Mock URL.createObjectURL and related functions
    const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
    const mockRevokeObjectURL = vi.fn()
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

    // Mock document.createElement and appendChild
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement
    const mockAppendChild = vi.fn()
    const mockRemoveChild = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild)
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild)

    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/backup codes/i)).toBeInTheDocument()
    })

    const downloadButton = screen.getByRole('button', { name: /download/i })
    await user.click(downloadButton)

    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockAnchor.click).toHaveBeenCalled()
    expect(mockAnchor.download).toBe('backup-codes.txt')
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('opens regenerate backup codes dialog', async () => {
    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/backup codes/i)).toBeInTheDocument()
    })

    const regenerateButton = screen.getByRole('button', { name: /regenerate/i })
    await user.click(regenerateButton)

    expect(screen.getByText(/regenerate backup codes/i)).toBeInTheDocument()
    expect(screen.getByText(/this will invalidate all existing backup codes/i)).toBeInTheDocument()
  })

  it('regenerates backup codes', async () => {
    mockRegenerateBackupCodes.mockResolvedValue({
      backupCodes: [
        { id: 'new-1', code: '11111-22222', isUsed: false },
        { id: 'new-2', code: '33333-44444', isUsed: false }
      ]
    })

    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/backup codes/i)).toBeInTheDocument()
    })

    const regenerateButton = screen.getByRole('button', { name: /regenerate/i })
    await user.click(regenerateButton)

    const confirmButton = screen.getByRole('button', { name: /regenerate codes/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockRegenerateBackupCodes).toHaveBeenCalled()
    })
  })

  it('displays trusted devices section', async () => {
    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/trusted devices/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/devices where you've chosen to skip 2fa/i)).toBeInTheDocument()
    expect(screen.getByText(/macbook pro/i)).toBeInTheDocument()
    expect(screen.getByText(/chrome 120.0 • macos 14.0/i)).toBeInTheDocument()
    expect(screen.getByText(/current device/i)).toBeInTheDocument()
  })

  it('allows removing trusted devices', async () => {
    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/trusted devices/i)).toBeInTheDocument()
    })

    const removeButton = screen.getByRole('button', { name: /remove/i })
    await user.click(removeButton)

    expect(mockRemoveTrustedDevice).toHaveBeenCalledWith('1')
  })

  it('opens MFA setup dialog when enabling', async () => {
    mockGetMFAStatus.mockResolvedValue({
      enabled: false,
      devices: [],
      backupCodes: [],
      trustedDevices: []
    })

    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/disabled/i)).toBeInTheDocument()
    })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(screen.getByTestId('totp-setup')).toBeInTheDocument()
  })

  it('opens verification dialog when disabling', async () => {
    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/enabled/i)).toBeInTheDocument()
    })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(screen.getByTestId('totp-verification')).toBeInTheDocument()
  })

  it('completes MFA setup', async () => {
    mockGetMFAStatus.mockResolvedValue({
      enabled: false,
      devices: [],
      backupCodes: [],
      trustedDevices: []
    })

    const onMFAStatusChange = vi.fn()
    renderWithProviders(<MFAManagement onMFAStatusChange={onMFAStatusChange} />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/disabled/i)).toBeInTheDocument()
    })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const completeButton = screen.getByRole('button', { name: /complete setup/i })
    await user.click(completeButton)

    expect(onMFAStatusChange).toHaveBeenCalledWith(true)
  })

  it('disables MFA after verification', async () => {
    const onMFAStatusChange = vi.fn()
    renderWithProviders(<MFAManagement onMFAStatusChange={onMFAStatusChange} />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/enabled/i)).toBeInTheDocument()
    })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const verifyButton = screen.getByRole('button', { name: /verify success/i })
    await user.click(verifyButton)

    await waitFor(() => {
      expect(mockDisableMFA).toHaveBeenCalled()
    })
  })

  it('handles MFA status change callback', async () => {
    const onMFAStatusChange = vi.fn()
    renderWithProviders(<MFAManagement onMFAStatusChange={onMFAStatusChange} />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/enabled/i)).toBeInTheDocument()
    })

    // Test enabling MFA
    mockGetMFAStatus.mockResolvedValue({
      enabled: false,
      devices: [],
      backupCodes: [],
      trustedDevices: []
    })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(screen.getByTestId('totp-verification')).toBeInTheDocument()
  })

  it('displays error messages', async () => {
    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    // Simulate an error by rejecting the regenerate backup codes call
    mockRegenerateBackupCodes.mockRejectedValue(new Error('Network error'))

    await waitFor(() => {
      expect(screen.getByText(/backup codes/i)).toBeInTheDocument()
    })

    const regenerateButton = screen.getByRole('button', { name: /regenerate/i })
    await user.click(regenerateButton)

    const confirmButton = screen.getByRole('button', { name: /regenerate codes/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to regenerate backup codes/i)).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    renderWithProviders(<MFAManagement className="custom-class" />, {
      authContext: mockAuthenticatedContext,
    })

    const container = screen.getByTestId('mfa-management') || document.querySelector('.custom-class')
    expect(container).toHaveClass('custom-class')
  })

  it('handles dialog state changes', async () => {
    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/enabled/i)).toBeInTheDocument()
    })

    // Open disable verification dialog
    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(screen.getByTestId('totp-verification')).toBeInTheDocument()

    // Close dialog
    const backButton = screen.getByRole('button', { name: /back/i })
    await user.click(backButton)

    expect(screen.queryByTestId('totp-verification')).not.toBeInTheDocument()
  })

  it('shows device last used time correctly', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    mockGetMFAStatus.mockResolvedValue({
      enabled: true,
      devices: [
        {
          id: '1',
          name: 'Google Authenticator',
          type: 'totp',
          isActive: true,
          lastUsed: twoHoursAgo,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ],
      backupCodes: [],
      trustedDevices: []
    })

    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument()
    })
  })

  it('handles device without last used time', async () => {
    mockGetMFAStatus.mockResolvedValue({
      enabled: true,
      devices: [
        {
          id: '1',
          name: 'Google Authenticator',
          type: 'totp',
          isActive: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ],
      backupCodes: [],
      trustedDevices: []
    })

    renderWithProviders(<MFAManagement />, {
      authContext: mockAuthenticatedContext,
    })

    await waitFor(() => {
      expect(screen.getByText(/never used/i)).toBeInTheDocument()
    })
  })
})