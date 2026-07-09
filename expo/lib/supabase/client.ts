import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Add these to your Expo environment before building:
// EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const rawSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

function getSupabaseConfigError(url: string, anonKey: string): string | null {
  if (!url || !anonKey) {
    return 'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for this EAS build profile.';
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) {
      return 'Invalid Supabase URL. Use the HTTPS project URL from Supabase, for example https://your-project.supabase.co.';
    }
  } catch {
    return 'Invalid Supabase URL. Use the HTTPS project URL from Supabase, for example https://your-project.supabase.co.';
  }

  return null;
}

export const supabaseConfigError = getSupabaseConfigError(rawSupabaseUrl, rawSupabaseAnonKey);
export const isSupabaseConfigured = supabaseConfigError === null;
export const supabaseConfig = {
  url: rawSupabaseUrl,
  hasAnonKey: rawSupabaseAnonKey.length > 0,
  error: supabaseConfigError,
} as const;

if (__DEV__ && supabaseConfigError) {
  console.warn(`[Supabase] ${supabaseConfigError}`);
}

const SAFE_UNCONFIGURED_SUPABASE_URL = 'https://missing-supabase-config.invalid';
const SAFE_UNCONFIGURED_SUPABASE_ANON_KEY = 'missing-supabase-config';

const SUPABASE_URL = isSupabaseConfigured ? rawSupabaseUrl : SAFE_UNCONFIGURED_SUPABASE_URL;
const SUPABASE_ANON_KEY = isSupabaseConfigured ? rawSupabaseAnonKey : SAFE_UNCONFIGURED_SUPABASE_ANON_KEY;

export function assertSupabaseConfigured(): void {
  if (supabaseConfigError) {
    throw new Error(supabaseConfigError);
  }
}

export function formatSupabaseError(error: unknown, fallback: string): string {
  if (supabaseConfigError) return supabaseConfigError;

  const message = error instanceof Error ? error.message : String(error || '');
  const lower = message.toLowerCase();

  if (lower.includes('network request failed') || lower.includes('fetch')) {
    return 'Connection issue. Please try again.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('over_email_send_rate_limit')) {
    return 'Too many signup attempts. Please wait a moment and try again.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'The email or password is incorrect.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'An account already exists for this email. Try signing in instead.';
  }
  if (lower.includes('invalid email') || lower.includes('email address is invalid')) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('password')) {
    return message;
  }

  return message || fallback;
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export const USER_KV_TABLE = 'user_kv';
