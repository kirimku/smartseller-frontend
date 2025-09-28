import React from 'react';
import { Progress } from '../../shared/components/ui/progress';
import { Check, X, AlertCircle, Shield } from 'lucide-react';

export interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
  requirements: PasswordRequirement[];
}

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
  required: boolean;
}

export interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  showStrengthBar?: boolean;
  showStrengthText?: boolean;
  minLength?: number;
  requireLowercase?: boolean;
  requireUppercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  customRequirements?: PasswordRequirement[];
  className?: string;
}

export const calculatePasswordStrength = (
  password: string,
  options: {
    minLength?: number;
    requireLowercase?: boolean;
    requireUppercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    customRequirements?: PasswordRequirement[];
  } = {}
): PasswordStrength => {
  const {
    minLength = 8,
    requireLowercase = true,
    requireUppercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    customRequirements = []
  } = options;

  const requirements: PasswordRequirement[] = [];
  const feedback: string[] = [];
  let score = 0;

  // Length requirement
  const hasMinLength = password.length >= minLength;
  requirements.push({
    id: 'length',
    label: `At least ${minLength} characters`,
    met: hasMinLength,
    required: true
  });
  if (hasMinLength) {
    score += 1;
  } else {
    feedback.push(`At least ${minLength} characters`);
  }

  // Lowercase requirement
  if (requireLowercase) {
    const hasLowercase = /[a-z]/.test(password);
    requirements.push({
      id: 'lowercase',
      label: 'One lowercase letter (a-z)',
      met: hasLowercase,
      required: true
    });
    if (hasLowercase) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }
  }

  // Uppercase requirement
  if (requireUppercase) {
    const hasUppercase = /[A-Z]/.test(password);
    requirements.push({
      id: 'uppercase',
      label: 'One uppercase letter (A-Z)',
      met: hasUppercase,
      required: true
    });
    if (hasUppercase) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }
  }

  // Numbers requirement
  if (requireNumbers) {
    const hasNumbers = /\d/.test(password);
    requirements.push({
      id: 'numbers',
      label: 'One number (0-9)',
      met: hasNumbers,
      required: true
    });
    if (hasNumbers) {
      score += 1;
    } else {
      feedback.push('One number');
    }
  }

  // Special characters requirement
  if (requireSpecialChars) {
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
    requirements.push({
      id: 'special',
      label: 'One special character (!@#$%^&*)',
      met: hasSpecialChars,
      required: true
    });
    if (hasSpecialChars) {
      score += 1;
    } else {
      feedback.push('One special character');
    }
  }

  // Add custom requirements
  customRequirements.forEach(req => {
    requirements.push(req);
    if (req.required && !req.met) {
      feedback.push(req.label);
    } else if (req.met) {
      score += 0.5; // Custom requirements add less to score
    }
  });

  // Additional strength checks (bonus points)
  if (password.length >= 12) score += 0.5; // Bonus for longer passwords
  if (/(.)\1{2,}/.test(password)) score -= 0.5; // Penalty for repeated characters
  if (/^(.{1,2})\1+$/.test(password)) score -= 1; // Penalty for patterns

  // Ensure score is within bounds
  score = Math.max(0, Math.min(5, score));

  // Determine if password is valid (all required requirements met)
  const requiredRequirements = requirements.filter(req => req.required);
  const isValid = requiredRequirements.every(req => req.met);

  return {
    score,
    feedback,
    isValid,
    requirements
  };
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
  showStrengthBar = true,
  showStrengthText = true,
  minLength = 8,
  requireLowercase = true,
  requireUppercase = true,
  requireNumbers = true,
  requireSpecialChars = true,
  customRequirements = [],
  className = ''
}) => {
  const strength = calculatePasswordStrength(password, {
    minLength,
    requireLowercase,
    requireUppercase,
    requireNumbers,
    requireSpecialChars,
    customRequirements
  });

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    if (score <= 4.5) return 'Strong';
    return 'Very Strong';
  };

  const getStrengthTextColor = (score: number, isValid: boolean) => {
    if (!isValid) return 'text-red-600';
    if (score <= 2) return 'text-orange-600';
    if (score <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar and Text */}
      {(showStrengthBar || showStrengthText) && (
        <div className="space-y-2">
          {showStrengthBar && (
            <div className="flex items-center space-x-3">
              <Progress 
                value={(strength.score / 5) * 100} 
                className="flex-1 h-2"
              />
              {showStrengthText && (
                <span className={`text-sm font-medium ${getStrengthTextColor(strength.score, strength.isValid)}`}>
                  {getStrengthText(strength.score)}
                </span>
              )}
            </div>
          )}
          
          {!showStrengthBar && showStrengthText && (
            <div className="flex items-center space-x-2">
              <Shield className={`h-4 w-4 ${getStrengthTextColor(strength.score, strength.isValid)}`} />
              <span className={`text-sm font-medium ${getStrengthTextColor(strength.score, strength.isValid)}`}>
                Password Strength: {getStrengthText(strength.score)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Requirements List */}
      {showRequirements && strength.requirements.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Password Requirements:
          </p>
          <ul className="space-y-1">
            {strength.requirements.map((requirement) => (
              <li
                key={requirement.id}
                className="flex items-center space-x-2 text-sm"
              >
                {requirement.met ? (
                  <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                ) : requirement.required ? (
                  <X className="h-3 w-3 text-red-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                )}
                <span
                  className={`${
                    requirement.met
                      ? 'text-green-600'
                      : requirement.required
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}
                >
                  {requirement.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Overall Status */}
      {strength.isValid && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <Check className="h-4 w-4" />
          <span className="font-medium">Password meets all requirements</span>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;