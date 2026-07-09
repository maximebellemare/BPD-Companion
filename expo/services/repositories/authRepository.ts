import { AuthUser, AuthSession, AuthCredentials, AuthSignUpInput } from '@/types/auth';
import { IAuthRepository } from './types';
import { assertSupabaseConfigured, formatSupabaseError, supabase } from '@/lib/supabase/client';
import { getOrCreateProfile } from '@/lib/supabase/profiles';
import type { Session as SbSession, User as SbUser } from '@supabase/supabase-js';

function getAuthErrorDetails(error: unknown) {
  const maybe = error as { status?: number; code?: string; message?: string; name?: string } | null;
  return {
    status: maybe?.status ?? null,
    code: maybe?.code ?? null,
    message: maybe?.message ?? (error instanceof Error ? error.message : String(error || '')),
    name: maybe?.name ?? (error instanceof Error ? error.name : null),
  };
}

function isRetryableSignupError(error: unknown): boolean {
  const details = getAuthErrorDetails(error);
  const message = details.message.toLowerCase();
  return details.status === 0 ||
    details.name === 'AuthRetryableFetchError' ||
    message.includes('network request failed') ||
    message.includes('failed to fetch');
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeSession(session: SbSession | null) {
  if (!session) return null;
  return {
    ...session,
    access_token: session.access_token ? '[redacted]' : session.access_token,
    refresh_token: session.refresh_token ? '[redacted]' : session.refresh_token,
    user: session.user
      ? {
          id: session.user.id,
          email: session.user.email,
          aud: session.user.aud,
          role: session.user.role,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
          email_confirmed_at: session.user.email_confirmed_at,
          phone_confirmed_at: session.user.phone_confirmed_at,
          last_sign_in_at: session.user.last_sign_in_at,
          app_metadata: session.user.app_metadata,
          user_metadata: session.user.user_metadata,
        }
      : null,
  };
}

function logAuthResponse(
  label: string,
  response: {
    data?: { user?: SbUser | null; session?: SbSession | null } | null;
    error?: unknown;
  },
) {
  if (!__DEV__) return;
  const errorDetails = getAuthErrorDetails(response.error);
  console.log(`[SupabaseAuth] ${label}`, {
    status: errorDetails.status,
    errorCode: errorDetails.code,
    message: errorDetails.message,
    errorName: errorDetails.name,
    hasError: Boolean(response.error),
    hasUser: Boolean(response.data?.user),
    hasSession: Boolean(response.data?.session),
    user: response.data?.user
      ? {
          id: response.data.user.id,
          email: response.data.user.email,
          aud: response.data.user.aud,
          role: response.data.user.role,
          created_at: response.data.user.created_at,
          updated_at: response.data.user.updated_at,
          email_confirmed_at: response.data.user.email_confirmed_at,
          last_sign_in_at: response.data.user.last_sign_in_at,
          user_metadata: response.data.user.user_metadata,
          app_metadata: response.data.user.app_metadata,
        }
      : null,
    session: sanitizeSession(response.data?.session ?? null),
  });
}

async function ensureProfileForSession(session: SbSession, context: string): Promise<void> {
  try {
    await getOrCreateProfile(session.user.id, session.user.email, session.user.created_at);
  } catch (error) {
    if (__DEV__) {
      console.log(`[SupabaseAuth] ${context} profile creation failed after auth success:`, error);
    }
  }
}

function mapUser(user: SbUser): AuthUser {
  const meta = (user.user_metadata ?? {}) as { display_name?: string; avatar_url?: string };
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: meta.display_name ?? (user.email ? user.email.split('@')[0] : 'You'),
    avatarUrl: meta.avatar_url,
    createdAt: user.created_at ? new Date(user.created_at).getTime() : Date.now(),
    lastLoginAt: Date.now(),
  };
}

function mapSession(session: SbSession): AuthSession {
  return {
    user: mapUser(session.user),
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: (session.expires_at ?? Math.floor(Date.now() / 1000) + 3600) * 1000,
  };
}

export class SupabaseAuthRepository implements IAuthRepository {
  async getCurrentUser(): Promise<AuthUser | null> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return mapUser(data.user);
  }

  async getSession(): Promise<AuthSession | null> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return mapSession(data.session);
  }

  async signIn(credentials: AuthCredentials): Promise<AuthSession> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error || !data.session) {
      throw new Error(formatSupabaseError(error, 'Sign in failed'));
    }
    return mapSession(data.session);
  }

  async signUp(input: AuthSignUpInput): Promise<AuthSession> {
    assertSupabaseConfigured();
    const runSignUpAttempt = async (attempt: 1 | 2): Promise<Awaited<ReturnType<typeof supabase.auth.signUp>>> => {
      if (__DEV__) {
        console.log(`[SupabaseAuth] signUp attempt ${attempt} started`);
      }
      const response = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { display_name: input.displayName },
        },
      });
      logAuthResponse(`signUp attempt ${attempt} response`, { data: response.data, error: response.error });
      return response;
    };

    let signUpResponse: Awaited<ReturnType<typeof supabase.auth.signUp>>;
    try {
      signUpResponse = await runSignUpAttempt(1);
      if (signUpResponse.error && isRetryableSignupError(signUpResponse.error) && !signUpResponse.data.session && !signUpResponse.data.user) {
        if (__DEV__) {
          console.log('[SupabaseAuth] signUp attempt 1 retryable error; retrying once after 700ms', getAuthErrorDetails(signUpResponse.error));
        }
        await wait(700);
        signUpResponse = await runSignUpAttempt(2);
      }
    } catch (error) {
      if (__DEV__) {
        console.log('[SupabaseAuth] signUp attempt 1 threw before Supabase returned a response', getAuthErrorDetails(error), error);
      }
      if (!isRetryableSignupError(error)) {
        throw error;
      }
      if (__DEV__) {
        console.log('[SupabaseAuth] signUp attempt 1 throw was retryable; retrying once after 700ms');
      }
      await wait(700);
      try {
        signUpResponse = await runSignUpAttempt(2);
      } catch (retryError) {
        if (__DEV__) {
          console.log('[SupabaseAuth] signUp attempt 2 threw before Supabase returned a response', getAuthErrorDetails(retryError), retryError);
        }
        throw retryError;
      }
    }
    const { data, error } = signUpResponse;
    if (data.session) {
      await ensureProfileForSession(data.session, error ? 'signUp with Supabase error' : 'signUp');
      return mapSession(data.session);
    }
    if (error) {
      const current = await supabase.auth.getSession();
      logAuthResponse('signUp error session check', { data: current.data, error: current.error });
      if (current.data.session) {
        await ensureProfileForSession(current.data.session, 'signUp error session check');
        return mapSession(current.data.session);
      }
      throw new Error(formatSupabaseError(error, 'Sign up failed'));
    }
    let signIn: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
    try {
      signIn = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
    } catch (signInError) {
      if (__DEV__) {
        console.log('[SupabaseAuth] post-signUp signIn threw before Supabase returned a response', getAuthErrorDetails(signInError), signInError);
      }
      throw signInError;
    }
    logAuthResponse('post-signUp signIn response', { data: signIn.data, error: signIn.error });
    if (signIn.error || !signIn.data.session) {
      if (data.user && !signIn.data.session) {
        throw new Error('Account created. Please confirm your email, then sign in.');
      }
      throw new Error(formatSupabaseError(signIn.error, 'Sign up did not complete.'));
    }
    await ensureProfileForSession(signIn.data.session, 'post-signUp signIn');
    return mapSession(signIn.data.session);
  }

  async resetPassword(email: string): Promise<void> {
    assertSupabaseConfigured();
    const redirectTo = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      throw new Error(formatSupabaseError(error, 'Unable to send reset instructions.'));
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(formatSupabaseError(error, 'Sign out failed'));
    }
  }

  async refreshSession(): Promise<AuthSession | null> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return null;
    return mapSession(data.session);
  }

  async updateUser(updates: Partial<AuthUser>): Promise<AuthUser> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: updates.displayName,
        avatar_url: updates.avatarUrl,
      },
    });
    if (error || !data.user) {
      throw new Error(formatSupabaseError(error, 'Update failed'));
    }
    return mapUser(data.user);
  }
}
