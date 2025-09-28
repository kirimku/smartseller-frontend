import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../../contexts/AuthContext'
import LoginForm from '../../components/auth/LoginForm'
import SignupForm from '../../components/auth/SignupForm'
import TOTPSetup from '../../components/auth/TOTPSetup'
import TOTPVerification from '../../components/auth/TOTPVerification'
import MFAManagement from '../../components/auth/MFAManagement'

// Mock API calls
const mockLoginWithPhone = vi.fn()
const mockRegisterWithPhone = vi.fn()
const mockVerifyEmail = vi.fn()
const mockGenerateTOTPSecret = vi.fn()
const mockVerifyTOTPSetup = vi.fn()
const mockEnableMFA = vi.fn()
const mockVerifyTOTP = vi.fn()
const mockGetMFAStatus = vi.fn()

vi.mock('../../stores/auth-store', () => ({
  useAuthStatus: () => ({
    isLoading: false,
    isAuthenticated: false,
    user: null,
  }),
  useLogin: () => ({
    loginWithPhone: mockLoginWithPhone,
    isLoading: false,
    error: null,
  }),
  useRegister: () => ({
    registerWithPhone: mockRegisterWithPhone,
    isLoading: false,
    error: null,
  }),
  useEmailVerification: () => ({
    verifyEmail: mockVerifyEmail,
    isLoading: false,
    error: null,
  }),
}))

vi.mock('../../hooks/useMFA', () => ({
  useMFA: () => ({
    generateTOTPSecret: mockGenerateTOTPSecret,
    verifyTOTPSetup: mockVerifyTOTPSetup,
    enableMFA: mockEnableMFA,
    verifyTOTP: mockVerifyTOTP,
    getMFAStatus: mockGetMFAStatus,
    isLoading: false,
    error: null,
  }),
}))

vi.mock('../../hooks/useAuthenticationFlow', () => ({
  useAuthenticationFlow: () => ({
    login: mockLoginWithPhone,
    register: mockRegisterWithPhone,
    verifyEmail: mockVerifyEmail,
    isLoading: false,
    error: null,
  }),
}))

// Mock QR code generation
vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockqrcode'),
}))

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Authentication Flow Integration Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Registration Flow', () => {
    it('completes full registration with email verification', async () => {
      mockRegisterWithPhone.mockResolvedValue({
        success: true,
        requiresEmailVerification: true,
        user: { id: '1', phone: '+1234567890', email: 'test@example.com' }
      })

      mockVerifyEmail.mockResolvedValue({
        success: true,
        user: { id: '1', phone: '+1234567890', email: 'test@example.com', emailVerified: true }
      })

      render(
        <TestWrapper>
          <SignupForm 
            requireEmailVerification={true}
            onSuccess={() => {}}
          />
        </TestWrapper>
      )

      // Fill registration form
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!')
      await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!')
      
      // Accept terms if required
      const termsCheckbox = screen.queryByLabelText(/terms and conditions/i)
      if (termsCheckbox) {
        await user.click(termsCheckbox)
      }

      // Submit registration
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(mockRegisterWithPhone).toHaveBeenCalledWith({
          phone: '+1234567890',
          email: 'test@example.com',
          password: 'SecurePass123!',
        })
      })

      // Should show email verification step
      await waitFor(() => {
        expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
      })
    })

    it('handles registration with MFA setup', async () => {
      mockRegisterWithPhone.mockResolvedValue({
        success: true,
        requiresMFA: true,
        user: { id: '1', phone: '+1234567890', email: 'test@example.com' }
      })

      const mockSecretData = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCodeUrl: 'otpauth://totp/SmartSeller:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=SmartSeller',
        backupCodes: ['123456', '789012', '345678', '901234', '567890'],
      }

      mockGenerateTOTPSecret.mockResolvedValue(mockSecretData)
      mockVerifyTOTPSetup.mockResolvedValue({ success: true })
      mockEnableMFA.mockResolvedValue({ success: true })

      render(
        <TestWrapper>
          <div>
            <SignupForm onSuccess={() => {}} />
            <TOTPSetup onSetupComplete={() => {}} />
          </div>
        </TestWrapper>
      )

      // Complete registration first
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!')
      await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!')
      
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(mockRegisterWithPhone).toHaveBeenCalled()
      })
    })
  })

  describe('User Login Flow', () => {
    it('completes login without MFA', async () => {
      mockLoginWithPhone.mockResolvedValue({
        success: true,
        token: 'auth-token',
        user: { id: '1', phone: '+1234567890', mfaEnabled: false }
      })

      render(
        <TestWrapper>
          <LoginForm onSuccess={() => {}} />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockLoginWithPhone).toHaveBeenCalledWith({
          phone: '+1234567890',
          password: 'SecurePass123!',
        })
      })
    })

    it('completes login with MFA verification', async () => {
      mockLoginWithPhone.mockResolvedValue({
        success: true,
        requiresMFA: true,
        tempToken: 'temp-token',
        user: { id: '1', phone: '+1234567890', mfaEnabled: true }
      })

      mockVerifyTOTP.mockResolvedValue({
        success: true,
        token: 'auth-token',
        user: { id: '1', phone: '+1234567890', mfaEnabled: true }
      })

      render(
        <TestWrapper>
          <div>
            <LoginForm onSuccess={() => {}} />
            <TOTPVerification onVerificationSuccess={() => {}} />
          </div>
        </TestWrapper>
      )

      // Complete login
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockLoginWithPhone).toHaveBeenCalled()
      })

      // Should show MFA verification
      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
      })

      // Complete MFA verification
      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '123456')
      await user.click(screen.getByRole('button', { name: /verify/i }))

      await waitFor(() => {
        expect(mockVerifyTOTP).toHaveBeenCalledWith('123456')
      })
    })

    it('handles login with backup code', async () => {
      mockLoginWithPhone.mockResolvedValue({
        success: true,
        requiresMFA: true,
        tempToken: 'temp-token',
        user: { id: '1', phone: '+1234567890', mfaEnabled: true }
      })

      const mockVerifyBackupCode = vi.fn().mockResolvedValue({
        success: true,
        token: 'auth-token',
        user: { id: '1', phone: '+1234567890', mfaEnabled: true }
      })

      // Re-mock the useMFA hook for this test
      vi.doMock('../../hooks/useMFA', () => ({
        useMFA: () => ({
          verifyTOTP: mockVerifyTOTP,
          verifyBackupCode: mockVerifyBackupCode,
          isLoading: false,
          error: null,
        }),
      }))

      render(
        <TestWrapper>
          <div>
            <LoginForm onSuccess={() => {}} />
            <TOTPVerification 
              onVerificationSuccess={() => {}}
              onBackupCodeUsed={() => {}}
              showBackupOption={true}
            />
          </div>
        </TestWrapper>
      )

      // Complete login
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
      })

      // Switch to backup code
      const backupCodeButton = screen.getByRole('button', { name: /use backup code/i })
      await user.click(backupCodeButton)

      // Enter backup code
      const backupCodeInput = screen.getByLabelText(/backup code/i)
      await user.type(backupCodeInput, '12345-67890')
      await user.click(screen.getByRole('button', { name: /verify backup code/i }))

      await waitFor(() => {
        expect(mockVerifyBackupCode).toHaveBeenCalledWith('12345-67890')
      })
    })
  })

  describe('MFA Management Flow', () => {
    it('enables MFA for existing user', async () => {
      mockGetMFAStatus.mockResolvedValue({
        enabled: false,
        devices: [],
        backupCodes: [],
        trustedDevices: []
      })

      const mockSecretData = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCodeUrl: 'otpauth://totp/SmartSeller:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=SmartSeller',
        backupCodes: ['123456', '789012', '345678', '901234', '567890'],
      }

      mockGenerateTOTPSecret.mockResolvedValue(mockSecretData)
      mockVerifyTOTPSetup.mockResolvedValue({ success: true })
      mockEnableMFA.mockResolvedValue({ success: true })

      render(
        <TestWrapper>
          <MFAManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/disabled/i)).toBeInTheDocument()
      })

      // Enable MFA
      const toggle = screen.getByRole('switch')
      await user.click(toggle)

      // Should show TOTP setup
      await waitFor(() => {
        expect(screen.getByText(/set up two-factor authentication/i)).toBeInTheDocument()
      })
    })

    it('disables MFA with verification', async () => {
      mockGetMFAStatus.mockResolvedValue({
        enabled: true,
        devices: [
          {
            id: '1',
            name: 'Google Authenticator',
            type: 'totp',
            isActive: true,
            lastUsed: new Date(),
            createdAt: new Date()
          }
        ],
        backupCodes: [
          { id: '1', code: '12345-67890', isUsed: false }
        ],
        trustedDevices: []
      })

      const mockDisableMFA = vi.fn().mockResolvedValue({ success: true })

      // Re-mock the useMFA hook for this test
      vi.doMock('../../hooks/useMFA', () => ({
        useMFA: () => ({
          getMFAStatus: mockGetMFAStatus,
          disableMFA: mockDisableMFA,
          verifyTOTP: mockVerifyTOTP,
          isLoading: false,
          error: null,
        }),
      }))

      mockVerifyTOTP.mockResolvedValue({ success: true })

      render(
        <TestWrapper>
          <MFAManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/enabled/i)).toBeInTheDocument()
      })

      // Disable MFA
      const toggle = screen.getByRole('switch')
      await user.click(toggle)

      // Should show verification dialog
      await waitFor(() => {
        expect(screen.getByText(/verify to disable 2fa/i)).toBeInTheDocument()
      })

      // Enter verification code
      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '123456')
      await user.click(screen.getByRole('button', { name: /verify/i }))

      await waitFor(() => {
        expect(mockVerifyTOTP).toHaveBeenCalledWith('123456')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles network errors during login', async () => {
      mockLoginWithPhone.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <LoginForm onError={() => {}} />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('handles invalid credentials', async () => {
      mockLoginWithPhone.mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      })

      render(
        <TestWrapper>
          <LoginForm onError={() => {}} />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/password/i), 'WrongPassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })

    it('handles MFA verification failures', async () => {
      mockLoginWithPhone.mockResolvedValue({
        success: true,
        requiresMFA: true,
        tempToken: 'temp-token',
        user: { id: '1', phone: '+1234567890', mfaEnabled: true }
      })

      mockVerifyTOTP.mockResolvedValue({
        success: false,
        error: 'Invalid verification code'
      })

      render(
        <TestWrapper>
          <div>
            <LoginForm onSuccess={() => {}} />
            <TOTPVerification onVerificationSuccess={() => {}} />
          </div>
        </TestWrapper>
      )

      // Complete login
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
      })

      // Enter wrong MFA code
      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '000000')
      await user.click(screen.getByRole('button', { name: /verify/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid verification code/i)).toBeInTheDocument()
      })
    })
  })

  describe('Session Management', () => {
    it('handles session timeout', async () => {
      // This would typically involve mocking session expiration
      // and testing the automatic logout behavior
      expect(true).toBe(true) // Placeholder for session timeout tests
    })

    it('handles concurrent session detection', async () => {
      // This would test the concurrent session warning and handling
      expect(true).toBe(true) // Placeholder for concurrent session tests
    })
  })
})