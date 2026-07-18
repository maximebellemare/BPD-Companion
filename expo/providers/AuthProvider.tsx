import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useQueryClient } from '@tanstack/react-query';
import { AuthSession, AuthUser, AuthCredentials, AuthSignUpInput } from '@/types/auth';
import { authRepository } from '@/services/repositories';
import { supabase } from '@/lib/supabase/client';
import { storageService } from '@/services/storage/storageService';
import { clearSingularCustomUserId, setSingularCustomUserId, trackSingularEvent } from '@/lib/singular';

type AuthMode = 'authenticated' | 'guest' | 'unauthenticated';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const current = await authRepository.getSession();
        if (!mounted) return;
        if (current) {
          console.log('[AuthProvider] Restored session');
          storageService.setUser(current.user.id);
          void setSingularCustomUserId(current.user.id);
          setSession(current);
          setUser(current.user);
          setIsGuest(false);
          await storageService.hydrateFromCloud();
          await queryClient.invalidateQueries();
        } else {
          storageService.setUser(null);
          void clearSingularCustomUserId();
        }
      } catch (e) {
        console.log('[AuthProvider] bootstrap error:', e);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    void bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, sbSession) => {
      console.log('[AuthProvider] auth event:', event);
      if (sbSession) {
        const mapped: AuthSession = {
          user: {
            id: sbSession.user.id,
            email: sbSession.user.email ?? '',
            displayName:
              (sbSession.user.user_metadata?.display_name as string | undefined) ??
              (sbSession.user.email ? sbSession.user.email.split('@')[0] : 'You'),
            avatarUrl: sbSession.user.user_metadata?.avatar_url as string | undefined,
            createdAt: sbSession.user.created_at
              ? new Date(sbSession.user.created_at).getTime()
              : Date.now(),
            lastLoginAt: Date.now(),
          },
          accessToken: sbSession.access_token,
          refreshToken: sbSession.refresh_token,
          expiresAt: (sbSession.expires_at ?? Math.floor(Date.now() / 1000) + 3600) * 1000,
        };
        storageService.setUser(mapped.user.id);
        void setSingularCustomUserId(mapped.user.id);
        setSession(mapped);
        setUser(mapped.user);
        setIsGuest(false);
      } else {
        storageService.setUser(null);
        void clearSingularCustomUserId();
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const signIn = useCallback(
    async (credentials: AuthCredentials) => {
      setIsLoading(true);
      try {
        const s = await authRepository.signIn(credentials);
        storageService.setUser(s.user.id);
        void setSingularCustomUserId(s.user.id);
        setSession(s);
        setUser(s.user);
        setIsGuest(false);
        await storageService.hydrateFromCloud();
        await queryClient.invalidateQueries();
        return s;
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient],
  );

  const signUp = useCallback(
    async (input: AuthSignUpInput, migrateGuest: boolean = false) => {
      setIsLoading(true);
      try {
        const prevUserId = storageService.getUserId();
        const s = await authRepository.signUp(input);
        storageService.setUser(s.user.id);
        void setSingularCustomUserId(s.user.id);
        void trackSingularEvent('sign_up');
        setSession(s);
        setUser(s.user);
        setIsGuest(false);
        try {
          if (migrateGuest) {
            await storageService.pushLocalToCloud(prevUserId);
          } else {
            await storageService.hydrateFromCloud();
          }
        } catch (error) {
          if (__DEV__) {
            console.log('[AuthProvider] post-signup storage sync failed after auth success:', error);
          }
        }
        try {
          await queryClient.invalidateQueries();
        } catch (error) {
          if (__DEV__) {
            console.log('[AuthProvider] post-signup query invalidation failed after auth success:', error);
          }
        }
        return s;
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    await authRepository.signOut();
    storageService.setUser(null);
    void clearSingularCustomUserId();
    setSession(null);
    setUser(null);
    setIsGuest(false);
    await queryClient.invalidateQueries();
  }, [queryClient]);

  const resetPassword = useCallback(async (email: string) => {
    await authRepository.resetPassword(email);
  }, []);

  const continueAsGuest = useCallback(() => {
    throw new Error('Guest mode is disabled. Please create an account or sign in.');
  }, []);

  const mode: AuthMode = useMemo(() => {
    if (session) return 'authenticated';
    if (isGuest) return 'guest';
    return 'unauthenticated';
  }, [session, isGuest]);

  return useMemo(
    () => ({
      session,
      user,
      isGuest,
      isLoading,
      isInitialized,
      isAuthenticated: session !== null,
      mode,
      signIn,
      signUp,
      signOut,
      resetPassword,
      continueAsGuest,
    }),
    [session, user, isGuest, isLoading, isInitialized, mode, signIn, signUp, signOut, resetPassword, continueAsGuest],
  );
});
