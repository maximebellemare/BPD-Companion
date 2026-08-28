import { supabase } from '@/lib/supabase/client';
import {
  buildMarketingPreferenceUpsert,
  EXISTING_USER_MARKETING_PROMPT_KEY,
} from '@/services/marketing/marketingPreferenceModel';
import type {
  MarketingPreferenceRecord,
  MarketingPromptStateRecord,
  MarketingPreferenceSource,
} from '@/services/marketing/marketingPreferenceModel';

const MARKETING_PREFERENCES_TABLE = 'marketing_preferences';
const MARKETING_PROMPT_STATE_TABLE = 'marketing_prompt_state';
const marketingPreferenceCache = new Map<string, MarketingPreferenceRecord | null>();
const marketingPromptStateCache = new Map<string, MarketingPromptStateRecord | null>();

function promptCacheKey(userId: string, promptKey: string): string {
  return `${userId}:${promptKey}`;
}

export function clearMarketingPreferenceCache(userId?: string): void {
  if (userId) {
    marketingPreferenceCache.delete(userId);
    for (const key of marketingPromptStateCache.keys()) {
      if (key.startsWith(`${userId}:`)) marketingPromptStateCache.delete(key);
    }
    return;
  }
  marketingPreferenceCache.clear();
  marketingPromptStateCache.clear();
}

export async function getMarketingPreference(userId: string): Promise<MarketingPreferenceRecord | null> {
  if (marketingPreferenceCache.has(userId)) {
    return marketingPreferenceCache.get(userId) ?? null;
  }

  const { data, error } = await supabase
    .from(MARKETING_PREFERENCES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<MarketingPreferenceRecord>();

  if (error) throw new Error(error.message);
  marketingPreferenceCache.set(userId, data ?? null);
  return data ?? null;
}

export async function updateMarketingPreference(
  userId: string,
  marketingOptIn: boolean,
  source: MarketingPreferenceSource,
): Promise<MarketingPreferenceRecord> {
  const previous = await getMarketingPreference(userId);
  const payload = buildMarketingPreferenceUpsert({
    userId,
    previous,
    nextOptIn: marketingOptIn,
    source,
    nowIso: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from(MARKETING_PREFERENCES_TABLE)
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single<MarketingPreferenceRecord>();

  if (error) throw new Error(error.message);
  marketingPreferenceCache.set(userId, data);
  return data;
}

export async function getMarketingPromptState(
  userId: string,
  promptKey: string = EXISTING_USER_MARKETING_PROMPT_KEY,
): Promise<MarketingPromptStateRecord | null> {
  const cacheKey = promptCacheKey(userId, promptKey);
  if (marketingPromptStateCache.has(cacheKey)) {
    return marketingPromptStateCache.get(cacheKey) ?? null;
  }

  const { data, error } = await supabase
    .from(MARKETING_PROMPT_STATE_TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('prompt_key', promptKey)
    .maybeSingle<MarketingPromptStateRecord>();

  if (error) throw new Error(error.message);
  marketingPromptStateCache.set(cacheKey, data ?? null);
  return data ?? null;
}

export async function dismissMarketingPrompt(
  userId: string,
  promptKey: string = EXISTING_USER_MARKETING_PROMPT_KEY,
): Promise<MarketingPromptStateRecord> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from(MARKETING_PROMPT_STATE_TABLE)
    .upsert({
      user_id: userId,
      prompt_key: promptKey,
      dismissed_at: nowIso,
    }, { onConflict: 'user_id,prompt_key' })
    .select('*')
    .single<MarketingPromptStateRecord>();

  if (error) throw new Error(error.message);
  marketingPromptStateCache.set(promptCacheKey(userId, promptKey), data);
  return data;
}

export async function acceptMarketingPrompt(
  userId: string,
  promptKey: string = EXISTING_USER_MARKETING_PROMPT_KEY,
): Promise<MarketingPromptStateRecord> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from(MARKETING_PROMPT_STATE_TABLE)
    .upsert({
      user_id: userId,
      prompt_key: promptKey,
      accepted_at: nowIso,
    }, { onConflict: 'user_id,prompt_key' })
    .select('*')
    .single<MarketingPromptStateRecord>();

  if (error) throw new Error(error.message);
  marketingPromptStateCache.set(promptCacheKey(userId, promptKey), data);
  return data;
}
