import { SubscriptionTier, PremiumFeature, FREE_DAILY_AI_LIMIT } from '@/types/subscription';

export type EntitlementCategory = 'free' | 'premium';

export interface FeatureEntitlement {
  feature: PremiumFeature;
  category: EntitlementCategory;
  label: string;
  description: string;
  freeLimit?: number;
  premiumLimit?: number | null;
}

export const FEATURE_ENTITLEMENTS: FeatureEntitlement[] = [
  {
    feature: 'unlimited_ai',
    category: 'premium',
    label: 'Unlimited AI Companion',
    description: 'Unlimited conversations with your AI companion',
    freeLimit: FREE_DAILY_AI_LIMIT,
    premiumLimit: null,
  },
  {
    feature: 'relationship_analysis',
    category: 'premium',
    label: 'Advanced Relationship Intelligence',
    description: 'Deep relationship pattern analysis across time',
  },
  {
    feature: 'relationship_copilot',
    category: 'premium',
    label: 'Advanced Relationship Copilot',
    description: 'Extended guided support with memory and pattern tracking',
  },
  {
    feature: 'weekly_reflection',
    category: 'premium',
    label: 'Weekly Reflection History',
    description: 'Access past weekly reflections and long-term trends',
  },
  {
    feature: 'therapist_report',
    category: 'premium',
    label: 'Therapist Report History & Export',
    description: 'Save, review, and export past therapist reports',
  },
  {
    feature: 'emotional_profile',
    category: 'premium',
    label: 'Long-Term Emotional Patterns',
    description: 'Months-long emotional pattern summaries and intelligence',
  },
  {
    feature: 'emotional_timeline',
    category: 'premium',
    label: 'Emotional Timeline',
    description: 'Detailed emotional history and episode replay',
  },
  {
    feature: 'predictive_insights',
    category: 'premium',
    label: 'Predictive Insights',
    description: 'Early pattern detection before escalation',
  },
  {
    feature: 'advanced_progress',
    category: 'premium',
    label: 'Advanced Progress Dashboard',
    description: 'Detailed metrics, trends, and growth tracking',
  },
  {
    feature: 'long_term_memory',
    category: 'premium',
    label: 'AI Memory & Insight Depth',
    description: 'AI remembers your patterns and grows with you',
  },
  {
    feature: 'emotional_simulator',
    category: 'premium',
    label: 'Response Simulator',
    description: 'Explore different response outcomes before acting',
  },
  {
    feature: 'therapy_plan',
    category: 'premium',
    label: 'Adaptive Therapy Plans',
    description: 'Personalized weekly plans that evolve with you',
  },
  {
    feature: 'ai_summaries',
    category: 'premium',
    label: 'AI Summaries',
    description: 'AI-generated summaries of your emotional patterns',
  },
  {
    feature: 'reflection_mirror',
    category: 'premium',
    label: 'Reflection Mirror',
    description: 'Deep self-reflection with AI guidance',
  },
];

const FREE_FEATURES: Set<string> = new Set([
  'check_in',
  'journal',
  'basic_tools',
  'basic_ai',
  'crisis_support',
  'safety_mode',
  'basic_rewrite',
  'grounding',
  'breathing',
  'dbt_basics',
  'crisis_regulation',
  'guided_regulation',
  'daily_ritual',
  'basic_weekly_reflection',
  'basic_therapy_report',
  'message_guard_basic',
  'basic_relationship_copilot',
]);

export function canAccess(feature: PremiumFeature, tier: SubscriptionTier): boolean {
  if (tier === 'premium') return true;

  const entitlement = FEATURE_ENTITLEMENTS.find(e => e.feature === feature);
  if (!entitlement) {
    console.log('[EntitlementService] Unknown feature, defaulting to free:', feature);
    return true;
  }

  return entitlement.category === 'free';
}

export function canAccessAI(dailyUsage: number, tier: SubscriptionTier): boolean {
  if (tier === 'premium') return true;
  return dailyUsage < FREE_DAILY_AI_LIMIT;
}

export function isFreeFeature(featureKey: string): boolean {
  return FREE_FEATURES.has(featureKey);
}

export function getEntitlement(feature: PremiumFeature): FeatureEntitlement | undefined {
  return FEATURE_ENTITLEMENTS.find(e => e.feature === feature);
}

export function getUpgradeReason(feature: PremiumFeature): string {
  const entitlement = getEntitlement(feature);
  if (!entitlement) return 'Unlock this feature with Premium.';

  const reasons: Record<PremiumFeature, string> = {
    unlimited_ai: 'Continue with unlimited AI conversations.',
    relationship_analysis: 'See deeper relationship patterns over time.',
    relationship_copilot: 'Access extended relationship support with pattern memory.',
    weekly_reflection: 'Review past reflections and track long-term growth.',
    therapist_report: 'Save and export therapy reports for your sessions.',
    emotional_profile: 'Explore months of emotional pattern intelligence.',
    emotional_timeline: 'Replay emotional episodes and see your full timeline.',
    predictive_insights: 'Get early warnings before patterns escalate.',
    advanced_progress: 'See detailed growth metrics and milestone tracking.',
    long_term_memory: 'Let your AI companion remember and grow with you.',
    emotional_simulator: 'Practice different responses before acting.',
    therapy_plan: 'Get personalized weekly plans that adapt to you.',
    ai_summaries: 'Read AI-generated summaries of your patterns.',
    reflection_mirror: 'Access deeper self-reflection with AI guidance.',
  };

  return reasons[feature] ?? entitlement.description;
}

export function shouldShowUpgradePrompt(
  feature: PremiumFeature,
  tier: SubscriptionTier,
  context?: { distressLevel?: number; isCrisis?: boolean }
): boolean {
  if (tier === 'premium') return false;

  if (context?.isCrisis || (context?.distressLevel !== undefined && context.distressLevel >= 8)) {
    console.log('[EntitlementService] Suppressing upgrade prompt during high distress/crisis');
    return false;
  }

  return !canAccess(feature, tier);
}

export function getPremiumFeaturesForTier(tier: SubscriptionTier): PremiumFeature[] {
  if (tier === 'premium') {
    return FEATURE_ENTITLEMENTS.map(e => e.feature);
  }
  return [];
}

export function getLockedFeatures(tier: SubscriptionTier): FeatureEntitlement[] {
  if (tier === 'premium') return [];
  return FEATURE_ENTITLEMENTS.filter(e => e.category === 'premium');
}
