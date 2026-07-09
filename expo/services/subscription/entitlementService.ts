import { SubscriptionTier, PremiumFeature, FREE_DAILY_AI_LIMIT, FREE_DAILY_REWRITE_LIMIT } from '@/types/subscription';

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
    feature: 'unlimited_rewrites',
    category: 'premium',
    label: 'Unlimited Message Rewrites',
    description: 'Unlimited message rewrites per day',
    freeLimit: FREE_DAILY_REWRITE_LIMIT,
    premiumLimit: null,
  },
  {
    feature: 'message_health_scoring',
    category: 'premium',
    label: 'Message Health Scoring',
    description: 'Detailed analysis of urgency, clarity, and escalation risk',
  },
  {
    feature: 'message_simulation',
    category: 'premium',
    label: 'Response Path Simulation',
    description: 'See likely outcomes of different communication choices',
  },
  {
    feature: 'secure_rewrite',
    category: 'premium',
    label: 'Secure Rewrite Engine',
    description: 'Calm, self-respecting rewrites that protect your dignity',
  },
  {
    feature: 'communication_insights',
    category: 'premium',
    label: 'Communication Insights',
    description: 'Learn what message styles work best for you over time',
  },
  {
    feature: 'communication_playbook',
    category: 'premium',
    label: 'Communication Playbook',
    description: 'Personalized strategies for common communication situations',
  },
  {
    feature: 'message_outcome_learning',
    category: 'premium',
    label: 'Outcome Learning',
    description: 'The app learns from your communication outcomes over time',
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
    feature: 'weekly_emotional_report',
    category: 'premium',
    label: 'Weekly Emotional Reports',
    description: 'Comprehensive weekly emotional pattern analysis',
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
  {
    feature: 'advanced_journal',
    category: 'premium',
    label: 'Advanced Journaling',
    description: 'AI-powered journal insights and guided reflection flows',
  },
  {
    feature: 'advanced_tools',
    category: 'premium',
    label: 'Advanced Tools',
    description: 'Full access to all therapeutic and regulation tools',
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
  'basic_journal',
  'basic_message_flow',
  'pause_timer',
  'draft_vault',
  'do_not_send',
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
  if (!entitlement) return 'Start membership for full access.';

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
    message_health_scoring: 'See detailed analysis of your message\'s emotional impact.',
    message_simulation: 'Preview likely outcomes of different communication paths.',
    secure_rewrite: 'Get calm, self-respecting rewrites that protect your dignity.',
    communication_insights: 'Discover what communication styles work best for you.',
    communication_playbook: 'Access personalized strategies for difficult conversations.',
    message_outcome_learning: 'Let the app learn from your outcomes to give better advice.',
    unlimited_rewrites: 'Continue with unlimited message rewrites.',
    advanced_journal: 'Continue with AI-powered journal insights and guided reflection.',
    weekly_emotional_report: 'Get comprehensive weekly emotional pattern reports.',
    advanced_tools: 'Access the full suite of therapeutic tools.',
  };

  return reasons[feature] ?? entitlement.description;
}

export function canAccessRewrite(dailyUsage: number, tier: SubscriptionTier): boolean {
  if (tier === 'premium') return true;
  return dailyUsage < FREE_DAILY_REWRITE_LIMIT;
}

export function hasReachedRewriteLimit(usage: number, tier: SubscriptionTier): boolean {
  if (tier === 'premium') return false;
  return usage >= FREE_DAILY_REWRITE_LIMIT;
}

export function getRemainingRewrites(usage: number, tier: SubscriptionTier): number | null {
  if (tier === 'premium') return null;
  return Math.max(0, FREE_DAILY_REWRITE_LIMIT - usage);
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
