import { supabase } from '@/lib/supabase/client';
import type { AccountProfile } from '@/types/accountProfile';

const PROFILES_TABLE = 'profiles';
const TRIAL_DAYS = 7;
const profileCache = new Map<string, AccountProfile>();

export function clearProfileCache(userId?: string): void {
  if (userId) {
    profileCache.delete(userId);
    return;
  }
  profileCache.clear();
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function buildNewProfile(userId: string, email?: string | null, createdAt?: string): AccountProfile {
  const started = createdAt ? new Date(createdAt) : new Date();
  const trialEndsAt = addDays(started, TRIAL_DAYS);

  return {
    id: userId,
    email: email ?? null,
    created_at: started.toISOString(),
    trial_started_at: started.toISOString(),
    trial_ends_at: trialEndsAt.toISOString(),
    onboarding_completed: false,
    onboarding_answers: null,
    updated_at: new Date().toISOString(),
  };
}

function isDuplicateProfileError(error: unknown): boolean {
  const maybe = error as { code?: string; message?: string } | null;
  const message = maybe?.message?.toLowerCase() ?? '';
  return maybe?.code === '23505' ||
    message.includes('duplicate key') ||
    message.includes('profiles_pkey');
}

async function loadProfile(userId: string): Promise<AccountProfile | null> {
  const cached = profileCache.get(userId);
  if (cached) return cached;

  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select('*')
    .eq('id', userId)
    .maybeSingle<AccountProfile>();

  if (error) throw new Error(error.message);
  if (data) {
    profileCache.set(userId, data);
  }
  return data ?? null;
}

export function isProfileTrialActive(profile: AccountProfile | null): boolean {
  if (!profile) return false;
  return new Date(profile.trial_ends_at).getTime() > Date.now();
}

export async function getOrCreateProfile(userId: string, email?: string | null, createdAt?: string): Promise<AccountProfile> {
  const existing = await loadProfile(userId);
  if (existing) return existing;

  const profile = buildNewProfile(userId, email, createdAt);
  const { data: inserted, error: insertError } = await supabase
    .from(PROFILES_TABLE)
    .insert(profile)
    .select('*')
    .single<AccountProfile>();

  if (insertError) {
    if (isDuplicateProfileError(insertError)) {
      const existingAfterDuplicate = await loadProfile(userId);
      if (existingAfterDuplicate) return existingAfterDuplicate;
    }
    throw new Error(insertError.message);
  }
  profileCache.set(userId, inserted);
  return inserted;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<AccountProfile, 'id' | 'created_at'>>,
): Promise<AccountProfile> {
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single<AccountProfile>();

  if (error) throw new Error(error.message);
  profileCache.set(userId, data);
  return data;
}

export async function completeProfileOnboarding(
  userId: string,
  personalization?: Record<string, unknown>,
): Promise<AccountProfile> {
  return updateProfile(userId, {
    onboarding_completed: true,
    onboarding_answers: personalization ?? null,
  });
}
