import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { useAuth } from '@/providers/AuthProvider';

export default function OnboardingGate() {
  const { hasCompletedOnboarding, isLoading } = useOnboarding();
  const { isInitialized, isAuthenticated, isGuest } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirected.current) return;
    if (!isInitialized) return;
    if (!isAuthenticated && !isGuest) return;
    if (segments[0] === 'auth') return;

    const isOnboardingScreen = segments.includes('onboarding' as never);

    if (!hasCompletedOnboarding && !isOnboardingScreen) {
      hasRedirected.current = true;
      console.log('[OnboardingGate] Redirecting to onboarding');
      const frame = requestAnimationFrame(() => {
        try {
          router.replace('/onboarding');
        } catch (e) {
          console.log('[OnboardingGate] replace error', e);
        }
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [hasCompletedOnboarding, isLoading, segments, router, isInitialized, isAuthenticated, isGuest]);

  return null;
}
