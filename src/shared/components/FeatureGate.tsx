import React, { ReactNode } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Crown, Zap, ArrowUpRight, Lock } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = false
}) => {
  const { tenant, hasFeature } = useTenant();

  if (!hasFeature(feature as any)) {
    if (showUpgradePrompt && tenant) {
      return (
        <UpgradePrompt 
          feature={feature}
          currentPlan={tenant.planType}
          fallback={fallback}
        />
      );
    }
    
    return fallback || null;
  }

  return <>{children}</>;
};

// Upgrade prompt component
interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
  fallback?: ReactNode;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  feature, 
  currentPlan, 
  fallback 
}) => {
  const featureInfo = FEATURE_INFO[feature] || {
    name: feature,
    description: 'This feature is not available in your current plan.',
    availableIn: ['premium', 'enterprise']
  };

  const nextPlan = getNextPlan(currentPlan);
  
  if (!nextPlan) {
    return fallback || null;
  }

  return (
    <Card className="border-dashed border-2 border-orange-200 bg-orange-50/50">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <Crown className="w-6 h-6 text-orange-600" />
        </div>
        <CardTitle className="text-lg">Upgrade to unlock {featureInfo.name}</CardTitle>
        <CardDescription>{featureInfo.description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800 mb-2">
            <Zap className="w-4 h-4 mr-1" />
            Available in {featureInfo.availableIn.join(' & ')} plans
          </div>
        </div>
        <Button className="w-full" onClick={() => handleUpgradeClick(nextPlan)}>
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to {nextPlan}
          <ArrowUpRight className="w-4 h-4 ml-2" />
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Start your free trial today, no commitment required
        </p>
      </CardContent>
    </Card>
  );
};

// Feature information for upgrade prompts
const FEATURE_INFO: Record<string, {
  name: string;
  description: string;
  availableIn: string[];
}> = {
  analytics: {
    name: 'Advanced Analytics',
    description: 'Get detailed insights into your store performance with advanced charts and reports.',
    availableIn: ['premium', 'enterprise']
  },
  multiCurrency: {
    name: 'Multi-Currency Support',
    description: 'Accept payments in multiple currencies and expand globally.',
    availableIn: ['premium', 'enterprise']
  },
  loyaltyProgram: {
    name: 'Loyalty Program',
    description: 'Build customer loyalty with points, rewards, and exclusive offers.',
    availableIn: ['premium', 'enterprise']
  },
  emailMarketing: {
    name: 'Email Marketing',
    description: 'Send automated emails, newsletters, and promotional campaigns.',
    availableIn: ['premium', 'enterprise']
  },
  api: {
    name: 'API Access',
    description: 'Integrate with third-party tools and build custom solutions.',
    availableIn: ['enterprise']
  },
  customDomain: {
    name: 'Custom Domain',
    description: 'Use your own domain name for a professional brand experience.',
    availableIn: ['enterprise']
  },
  wishlist: {
    name: 'Customer Wishlist',
    description: 'Let customers save products for later and increase engagement.',
    availableIn: ['premium', 'enterprise']
  },
  flashDeals: {
    name: 'Flash Deals',
    description: 'Create time-limited offers to drive urgency and boost sales.',
    availableIn: ['premium', 'enterprise']
  },
  subscriptions: {
    name: 'Subscription Products',
    description: 'Sell recurring subscription products for predictable revenue.',
    availableIn: ['premium', 'enterprise']
  },
  socialLogin: {
    name: 'Social Login',
    description: 'Allow customers to sign in with Google, Facebook, and other platforms.',
    availableIn: ['premium', 'enterprise']
  }
};

// Get next available plan
function getNextPlan(currentPlan: string): string | null {
  switch (currentPlan) {
    case 'basic':
      return 'Premium';
    case 'premium':
      return 'Enterprise';
    default:
      return null;
  }
}

// Handle upgrade click
function handleUpgradeClick(plan: string) {
  // In a real app, this would open billing/upgrade modal
  console.log(`Upgrade to ${plan} clicked`);
  // For now, just show an alert
  alert(`Upgrade to ${plan} plan - this would open the billing modal in a real app`);
}

// Simple feature lock component for disabled UI elements
export const FeatureLock: React.FC<{
  feature: string;
  children: ReactNode;
  className?: string;
}> = ({ feature, children, className }) => {
  const { hasFeature } = useTenant();

  if (hasFeature(feature as any)) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className || ''}`}>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
          <Lock className="w-4 h-4" />
          <span>Premium Feature</span>
        </div>
      </div>
    </div>
  );
};

// Plan badge component
export const PlanBadge: React.FC<{
  plan: string;
  showIcon?: boolean;
  variant?: 'default' | 'compact';
}> = ({ plan, showIcon = true, variant = 'default' }) => {
  const planConfig = {
    basic: { color: 'bg-gray-100 text-gray-800', icon: '📦' },
    premium: { color: 'bg-blue-100 text-blue-800', icon: '⭐' },
    enterprise: { color: 'bg-purple-100 text-purple-800', icon: '👑' }
  };

  const config = planConfig[plan.toLowerCase() as keyof typeof planConfig] || planConfig.basic;
  const isCompact = variant === 'compact';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {showIcon && <span>{config.icon}</span>}
      <span className={isCompact ? 'sr-only' : ''}>{plan}</span>
    </span>
  );
};