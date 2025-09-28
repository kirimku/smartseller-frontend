import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PasswordStrengthIndicator from '../PasswordStrengthIndicator'

describe('PasswordStrengthIndicator', () => {
  beforeEach(() => {
    // Reset any global state if needed
  })

  it('renders with empty password', () => {
    render(<PasswordStrengthIndicator password="" />)
    
    // Should show initial state
    expect(screen.getByText(/password strength/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('shows weak strength for short passwords', () => {
    render(<PasswordStrengthIndicator password="123" />)
    
    expect(screen.getByText(/weak/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows fair strength for medium passwords', () => {
    render(<PasswordStrengthIndicator password="password123" />)
    
    expect(screen.getByText(/fair/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('shows good strength for strong passwords', () => {
    render(<PasswordStrengthIndicator password="Password123" />)
    
    expect(screen.getByText(/good/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75')
  })

  it('shows excellent strength for very strong passwords', () => {
    render(<PasswordStrengthIndicator password="Password123!@#" />)
    
    expect(screen.getByText(/excellent/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('displays password requirements', () => {
    render(<PasswordStrengthIndicator password="abc" showRequirements={true} />)
    
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument()
    expect(screen.getByText(/lowercase letter/i)).toBeInTheDocument()
    expect(screen.getByText(/number/i)).toBeInTheDocument()
    expect(screen.getByText(/special character/i)).toBeInTheDocument()
  })

  it('shows met requirements with checkmarks', () => {
    render(<PasswordStrengthIndicator password="Password123!" showRequirements={true} />)
    
    // All requirements should be met and show checkmarks
    const checkmarks = screen.getAllByTestId('requirement-met')
    expect(checkmarks).toHaveLength(5) // 5 requirements
  })

  it('shows unmet requirements with X marks', () => {
    render(<PasswordStrengthIndicator password="abc" showRequirements={true} />)
    
    // Most requirements should be unmet
    const xMarks = screen.getAllByTestId('requirement-unmet')
    expect(xMarks.length).toBeGreaterThan(0)
  })

  it('validates minimum length requirement', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="abc" showRequirements={true} />)
    
    expect(screen.getByTestId('requirement-unmet')).toBeInTheDocument()
    
    rerender(<PasswordStrengthIndicator password="abcdefgh" showRequirements={true} />)
    
    // Length requirement should now be met
    expect(screen.getByText(/at least 8 characters/i).closest('div')).toContainElement(
      screen.getByTestId('requirement-met')
    )
  })

  it('validates uppercase letter requirement', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="password123" showRequirements={true} />)
    
    // Should show unmet uppercase requirement
    expect(screen.getByText(/uppercase letter/i).closest('div')).toContainElement(
      screen.getByTestId('requirement-unmet')
    )
    
    rerender(<PasswordStrengthIndicator password="Password123" showRequirements={true} />)
    
    // Uppercase requirement should now be met
    expect(screen.getByText(/uppercase letter/i).closest('div')).toContainElement(
      screen.getByTestId('requirement-met')
    )
  })

  it('validates lowercase letter requirement', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="PASSWORD123" showRequirements={true} />)
    
    // Should show unmet lowercase requirement
    expect(screen.getByText(/lowercase letter/i).closest('div')).toContainElement(
      screen.getByTestId('requirement-unmet')
    )
    
    rerender(<PasswordStrengthIndicator password="Password123" showRequirements={true} />)
    
    // Lowercase requirement should now be met
    expect(screen.getByText(/lowercase letter/i).closest('div')).toContainElement(
      screen.getByTestId('requirement-met')
    )
  })

  it('validates number requirement', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="Password" showRequirements={true} />)
    
    // Should show unmet number requirement
    expect(screen.getByText(/number/i).closest('div')).toContainElement(
      screen.getByTestId('requirement-unmet')
    )
    
    rerender(<PasswordStrengthIndicator password="Password123" showRequirements={true} />)
    
    // Number requirement should now be met
    expect(screen.getByText(/number/i).closest('div')).toContainElement(
      screen.getByTestId('requirement-met')
    )
  })

  it('validates special character requirement', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="Password123" showRequirements={true} />)
    
    // Should show unmet special character requirement
    expect(screen.getByText(/special character/i).closest('div')).toContainElement(
      screen.getByTestId('requirement-unmet')
    )
    
    rerender(<PasswordStrengthIndicator password="Password123!" showRequirements={true} />)
    
    // Special character requirement should now be met
    expect(screen.getByText(/special character/i).closest('div')).toContainElement(
      screen.getByTestId('requirement-met')
    )
  })

  it('supports custom minimum length', () => {
    render(<PasswordStrengthIndicator password="abc" minLength={12} showRequirements={true} />)
    
    expect(screen.getByText(/at least 12 characters/i)).toBeInTheDocument()
  })

  it('supports hiding requirements', () => {
    render(<PasswordStrengthIndicator password="abc" showRequirements={false} />)
    
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/uppercase letter/i)).not.toBeInTheDocument()
  })

  it('applies correct color classes for different strengths', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="123" />)
    
    // Weak password should have red/danger styling
    expect(screen.getByRole('progressbar')).toHaveClass('bg-red-500')
    
    rerender(<PasswordStrengthIndicator password="password123" />)
    
    // Fair password should have yellow/warning styling
    expect(screen.getByRole('progressbar')).toHaveClass('bg-yellow-500')
    
    rerender(<PasswordStrengthIndicator password="Password123" />)
    
    // Good password should have blue/info styling
    expect(screen.getByRole('progressbar')).toHaveClass('bg-blue-500')
    
    rerender(<PasswordStrengthIndicator password="Password123!@#" />)
    
    // Excellent password should have green/success styling
    expect(screen.getByRole('progressbar')).toHaveClass('bg-green-500')
  })

  it('provides accessibility attributes', () => {
    render(<PasswordStrengthIndicator password="Password123" />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-label', 'Password strength')
    expect(progressBar).toHaveAttribute('aria-valuenow', '75')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  it('handles edge cases', () => {
    // Very long password
    const longPassword = 'a'.repeat(100)
    render(<PasswordStrengthIndicator password={longPassword} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    
    // Password with only special characters
    const { rerender } = render(<PasswordStrengthIndicator password="!@#$%^&*()" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    
    // Password with unicode characters
    rerender(<PasswordStrengthIndicator password="Pássword123!" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('updates strength in real-time', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="" />)
    
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    
    rerender(<PasswordStrengthIndicator password="P" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    
    rerender(<PasswordStrengthIndicator password="Password" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
    
    rerender(<PasswordStrengthIndicator password="Password123" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75')
    
    rerender(<PasswordStrengthIndicator password="Password123!" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })
})