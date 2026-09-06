export type SubscriptionTier = 'free' | 'premium';

export type SubscriptionPeriod = 'monthly' | 'yearly';
export type SubscriptionPlanPeriod = SubscriptionPeriod | 'lifetime';

export interface SubscriptionPlan {
  id: string;
  name: string;
  period: SubscriptionPlanPeriod;
  price: number;
  priceLabel: string;
  savings?: string;
  badge?: 'mostPopular' | 'bestValue';
  popular?: boolean;
  productIdentifier?: string;
  packageIdentifier?: string;
  isFallbackPrice?: boolean;
  androidTrialCopy?: string | null;
  trialDays?: number | null;
  trialEligibilityStatus?: 'eligible' | 'ineligible' | 'unknown';
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  plan: SubscriptionPlan | null;
  expiresAt: number | null;
  startedAt: number | null;
  trialEndsAt: number | null;
  isTrialActive: boolean;
}

export type PremiumFeature =
  | 'unlimited_ai'
  | 'predictive_insights'
  | 'therapy_plan'
  | 'relationship_analysis'
  | 'ai_summaries'
  | 'advanced_progress'
  | 'emotional_simulator'
  | 'weekly_reflection'
  | 'therapist_report'
  | 'relationship_copilot'
  | 'emotional_profile'
  | 'emotional_timeline'
  | 'reflection_mirror'
  | 'long_term_memory'
  | 'message_health_scoring'
  | 'message_simulation'
  | 'secure_rewrite'
  | 'communication_insights'
  | 'communication_playbook'
  | 'message_outcome_learning'
  | 'unlimited_rewrites'
  | 'advanced_journal'
  | 'weekly_emotional_report'
  | 'advanced_tools';

export interface PremiumFeatureInfo {
  id: PremiumFeature;
  title: string;
  description: string;
  icon: string;
}

export const PREMIUM_FEATURES: PremiumFeatureInfo[] = [
  {
    id: 'unlimited_ai',
    title: 'Unlimited AI Companion',
    description: 'No daily conversation limits with your personal AI support',
    icon: 'sparkles',
  },
  {
    id: 'secure_rewrite',
    title: 'Secure Rewrite Engine',
    description: 'Calm, self-respecting rewrites that protect your dignity',
    icon: 'shield',
  },
  {
    id: 'message_simulation',
    title: 'Response Path Simulation',
    description: 'See likely outcomes of different communication choices',
    icon: 'compass',
  },
  {
    id: 'message_health_scoring',
    title: 'Message Health Scoring',
    description: 'Detailed analysis of urgency, clarity, and escalation risk',
    icon: 'bar-chart-3',
  },
  {
    id: 'communication_insights',
    title: 'Communication Insights',
    description: 'Learn what message styles work best for you over time',
    icon: 'lightbulb',
  },
  {
    id: 'weekly_reflection',
    title: 'Weekly Reflections',
    description: 'Thoughtful summaries of your emotional week',
    icon: 'file-text',
  },
  {
    id: 'weekly_emotional_report',
    title: 'Weekly Emotional Reports',
    description: 'Comprehensive weekly emotional pattern analysis',
    icon: 'activity',
  },
  {
    id: 'relationship_copilot',
    title: 'Relationship Copilot',
    description: 'Guided support during relationship-triggered distress',
    icon: 'heart',
  },
  {
    id: 'predictive_insights',
    title: 'Predictive Insights',
    description: 'Early detection of emotional patterns before they escalate',
    icon: 'eye',
  },
  {
    id: 'therapist_report',
    title: 'Therapist Reports',
    description: 'Structured summaries to bring into therapy sessions',
    icon: 'clipboard',
  },
  {
    id: 'advanced_progress',
    title: 'Advanced Progress Dashboard',
    description: 'Detailed metrics, trends, and growth tracking',
    icon: 'trending-up',
  },
  {
    id: 'emotional_profile',
    title: 'Emotional Pattern Intelligence',
    description: 'Deep understanding of your triggers, chains, and coping',
    icon: 'brain',
  },
  {
    id: 'therapy_plan',
    title: 'Adaptive Therapy Plans',
    description: 'Personalized weekly plans that evolve with you',
    icon: 'calendar',
  },
  {
    id: 'emotional_simulator',
    title: 'Response Simulator',
    description: 'Explore different ways to respond before acting',
    icon: 'git-branch',
  },
  {
    id: 'advanced_tools',
    title: 'Advanced Tools',
    description: 'Full access to all therapeutic and regulation tools',
    icon: 'zap',
  },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    period: 'monthly',
    price: 9.99,
    priceLabel: '$9.99/mo',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    period: 'yearly',
    price: 59.99,
    priceLabel: '$59.99/yr',
    savings: 'Save 50%',
    popular: true,
  },
];

export const FREE_DAILY_AI_LIMIT = 5;
export const FREE_DAILY_REWRITE_LIMIT = 3;
