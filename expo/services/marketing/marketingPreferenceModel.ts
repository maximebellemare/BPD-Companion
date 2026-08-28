export type MarketingPreferenceSource = 'onboarding' | 'profile' | 'existing_user_prompt';

export const EXISTING_USER_MARKETING_PROMPT_KEY = 'existing_user_email_offer_v1';

export type MarketingPreferenceRecord = {
  user_id: string;
  marketing_opt_in: boolean;
  marketing_consent_at: string | null;
  marketing_unsubscribed_at: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketingPromptStateRecord = {
  user_id: string;
  prompt_key: string;
  dismissed_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketingPromptDecisionInput = {
  preference: Pick<MarketingPreferenceRecord, 'marketing_opt_in' | 'marketing_unsubscribed_at'> | null;
  promptState: Pick<MarketingPromptStateRecord, 'dismissed_at' | 'accepted_at'> | null;
  preferenceLoaded: boolean;
  promptStateLoaded: boolean;
};

export type MarketingPreferenceTransitionInput = {
  userId: string;
  previous?: Pick<MarketingPreferenceRecord, 'marketing_opt_in' | 'marketing_consent_at' | 'marketing_unsubscribed_at'> | null;
  nextOptIn: boolean;
  source: MarketingPreferenceSource;
  nowIso: string;
};

export type MarketingPreferenceUpsert = {
  user_id: string;
  marketing_opt_in: boolean;
  marketing_consent_at: string | null;
  marketing_unsubscribed_at: string | null;
  source: MarketingPreferenceSource;
};

export function buildMarketingPreferenceUpsert({
  userId,
  previous,
  nextOptIn,
  source,
  nowIso,
}: MarketingPreferenceTransitionInput): MarketingPreferenceUpsert {
  const previousOptIn = previous?.marketing_opt_in ?? false;
  const changed = previousOptIn !== nextOptIn;

  if (nextOptIn) {
    return {
      user_id: userId,
      marketing_opt_in: true,
      marketing_consent_at: changed ? nowIso : previous?.marketing_consent_at ?? nowIso,
      marketing_unsubscribed_at: null,
      source,
    };
  }

  return {
    user_id: userId,
    marketing_opt_in: false,
    marketing_consent_at: previous?.marketing_consent_at ?? null,
    marketing_unsubscribed_at: changed ? nowIso : previous?.marketing_unsubscribed_at ?? null,
    source,
  };
}

export function createLocalMarketingPreference(
  userId: string,
  marketingOptIn: boolean,
  source: MarketingPreferenceSource,
  nowIso: string,
): MarketingPreferenceRecord {
  const upsert = buildMarketingPreferenceUpsert({
    userId,
    previous: null,
    nextOptIn: marketingOptIn,
    source,
    nowIso,
  });

  return {
    ...upsert,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

export function shouldShowExistingUserMarketingPrompt(input: MarketingPromptDecisionInput): boolean {
  if (!input.preferenceLoaded || !input.promptStateLoaded) return false;
  if (input.preference) return false;
  if (input.promptState?.dismissed_at || input.promptState?.accepted_at) return false;
  return true;
}
