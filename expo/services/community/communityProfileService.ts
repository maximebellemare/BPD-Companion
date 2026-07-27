import { storageService } from '@/services/storage/storageService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { localizedText } from '@/lib/i18n/staticText';

const COMMUNITY_PROFILE_KEY = 'community_profile_v1';
const RESERVED_USERNAMES_KEY = 'community_reserved_usernames_v1';

export type CommunityProfile = {
  username: string;
  displayName?: string;
  avatarColor: string;
  updatedAt: number;
};

export type CommunityProfileInput = {
  username: string;
  displayName?: string;
  avatarColor: string;
};

const DEFAULT_AVATAR_COLOR = '#2E2A72';
const RESERVED_DEMO_USERNAMES = new Set([
  'healing_slowly',
  'brave_steps',
  'gentle_mind',
  'recovery_road',
  'anonymous',
]);

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  const normalized = normalizeUsername(username);
  if (normalized.length < 3) return 'Username must be at least 3 characters.';
  if (normalized.length > 20) return 'Username must be 20 characters or fewer.';
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return 'Use only letters, numbers, and underscores. No spaces.';
  }
  return null;
}

export async function loadCommunityProfile(): Promise<CommunityProfile | null> {
  const profile = await storageService.get<Partial<CommunityProfile> | null>(COMMUNITY_PROFILE_KEY);
  if (!profile?.username) return null;

  return {
    username: profile.username,
    displayName: profile.displayName,
    avatarColor: profile.avatarColor || DEFAULT_AVATAR_COLOR,
    updatedAt: typeof profile.updatedAt === 'number' ? profile.updatedAt : Date.now(),
  };
}

export async function ensureCommunityProfile(): Promise<CommunityProfile> {
  const existing = await loadCommunityProfile();
  if (existing) return existing;

  const suffix = Date.now().toString(36).slice(-6);
  return saveCommunityProfile({
    username: `member_${suffix}`,
    avatarColor: DEFAULT_AVATAR_COLOR,
  });
}

async function loadReservedUsernames(): Promise<string[]> {
  return (await storageService.get<string[]>(RESERVED_USERNAMES_KEY)) ?? [];
}

export async function isUsernameAvailable(username: string, currentUsername?: string | null): Promise<boolean> {
  const normalized = normalizeUsername(username);
  if (currentUsername && normalizeUsername(currentUsername) === normalized) return true;
  if (RESERVED_DEMO_USERNAMES.has(normalized)) return false;

  if (!__DEV__ && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', normalized)
      .maybeSingle();
    if (!error && data?.username) return false;
  }

  const reserved = await loadReservedUsernames();
  return !reserved.includes(normalized);
}

export async function saveCommunityProfile(input: CommunityProfileInput): Promise<CommunityProfile> {
  const normalized = normalizeUsername(input.username);
  const validationError = validateUsername(normalized);
  if (validationError) throw new Error(validationError);

  const existing = await loadCommunityProfile();
  const available = await isUsernameAvailable(normalized, existing?.username);
  if (!available) throw new Error('That username is already taken. Try another one.');

  const profile: CommunityProfile = {
    username: normalized,
    displayName: input.displayName?.trim() || undefined,
    avatarColor: input.avatarColor || DEFAULT_AVATAR_COLOR,
    updatedAt: Date.now(),
  };

  const reserved = await loadReservedUsernames();
  const nextReserved = Array.from(new Set([
    ...reserved.filter((name) => name !== existing?.username),
    normalized,
  ]));

  await storageService.set(COMMUNITY_PROFILE_KEY, profile);
  await storageService.set(RESERVED_USERNAMES_KEY, nextReserved);
  return profile;
}

export function getCommunityAuthor(profile: CommunityProfile, isAnonymous: boolean) {
  if (isAnonymous) {
    return {
      id: 'current_user',
      displayName: localizedText('Anonymous', 'Anónimo/a'),
      username: profile.username,
      avatarColor: profile.avatarColor,
      isAnonymous: true,
    };
  }

  return {
    id: 'current_user',
    displayName: profile.displayName || profile.username,
    username: profile.username,
    avatarColor: profile.avatarColor,
    isAnonymous: false,
  };
}

export function getPublicAuthorLabel(author: {
  id: string;
  displayName: string;
  isAnonymous: boolean;
  username?: string;
}): string {
  if (author.id === 'current_user') {
    return author.isAnonymous
      ? localizedText('You · Anonymous', 'Tú · Anónimo/a')
      : `${localizedText('You', 'Tú')} · @${author.username ?? author.displayName}`;
  }
  if (author.isAnonymous) return localizedText('🫧 Anonymous', '🫧 Anónimo/a');
  return author.username ? `@${author.username}` : author.displayName;
}
