import { AuthUser, AuthSession, AuthCredentials, AuthSignUpInput } from '@/types/auth';
import { IAuthRepository } from './types';
import { supabase } from '@/services/supabase/supabaseClient';
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
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      console.log('[AuthRepository] getCurrentUser: null');
      return null;
    }
    return mapUser(data.user);
  }

  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return mapSession(data.session);
  }

  async signIn(credentials: AuthCredentials): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error || !data.session) {
      console.log('[AuthRepository] signIn error:', error?.message);
      throw new Error(error?.message ?? 'Sign in failed');
    }
    return mapSession(data.session);
  }

  async signUp(input: AuthSignUpInput): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { display_name: input.displayName },
      },
    });
    if (error) {
      console.log('[AuthRepository] signUp error:', error.message);
      throw new Error(error.message);
    }
    if (!data.session) {
      const signIn = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (signIn.error || !signIn.data.session) {
        throw new Error(signIn.error?.message ?? 'Please confirm your email to continue');
      }
      return mapSession(signIn.data.session);
    }
    return mapSession(data.session);
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log('[AuthRepository] signOut error:', error.message);
    }
  }

  async refreshSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return null;
    return mapSession(data.session);
  }

  async updateUser(updates: Partial<AuthUser>): Promise<AuthUser> {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: updates.displayName,
        avatar_url: updates.avatarUrl,
      },
    });
    if (error || !data.user) {
      throw new Error(error?.message ?? 'Update failed');
    }
    return mapUser(data.user);
  }
}
