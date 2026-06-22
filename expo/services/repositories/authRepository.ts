import { AuthUser, AuthSession, AuthCredentials, AuthSignUpInput } from '@/types/auth';
import { IAuthRepository } from './types';
import { assertSupabaseConfigured, formatSupabaseError, supabase } from '@/lib/supabase/client';
import { getOrCreateProfile } from '@/lib/supabase/profiles';
import type { Session as SbSession, User as SbUser } from '@supabase/supabase-js';

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
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { display_name: input.displayName },
      },
    });
    if (error) {
      throw new Error(formatSupabaseError(error, 'Sign up failed'));
    }
    if (!data.session) {
      const signIn = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (signIn.error || !signIn.data.session) {
        throw new Error(formatSupabaseError(signIn.error, 'Please confirm your email to continue'));
      }
      await getOrCreateProfile(
        signIn.data.session.user.id,
        signIn.data.session.user.email,
        signIn.data.session.user.created_at,
      );
      return mapSession(signIn.data.session);
    }
    await getOrCreateProfile(data.session.user.id, data.session.user.email, data.session.user.created_at);
    return mapSession(data.session);
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
