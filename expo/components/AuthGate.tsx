import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthGate() {
  const { isInitialized, isAuthenticated, isGuest } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const lastTarget = useRef<string | null>(null);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'auth';
    const needsAuth = !isAuthenticated && !isGuest;

    if (needsAuth && !inAuthGroup) {
      if (lastTarget.current === 'auth') return;
      lastTarget.current = 'auth';
      console.log('[AuthGate] Redirecting to /auth/welcome');
      const frame = requestAnimationFrame(() => {
        try {
          router.replace('/auth/welcome');
        } catch (e) {
          console.log('[AuthGate] replace error', e);
        }
      });
      return () => cancelAnimationFrame(frame);
    }

    if (!needsAuth && inAuthGroup) {
      if (lastTarget.current === 'app') return;
      lastTarget.current = 'app';
      console.log('[AuthGate] Leaving auth group');
      const frame = requestAnimationFrame(() => {
        try {
          router.replace('/');
        } catch (e) {
          console.log('[AuthGate] replace error', e);
        }
      });
      return () => cancelAnimationFrame(frame);
    }

    lastTarget.current = null;
  }, [isInitialized, isAuthenticated, isGuest, segments, router]);

  return null;
}
