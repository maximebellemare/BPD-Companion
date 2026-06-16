import { useEffect, useMemo, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useUserProfile } from '@/providers/UserProfileProvider';
import { isProfileTrialActive } from '@/lib/supabase/profiles';
import Colors from '@/constants/colors';

function getTopRoute(segments: string[]): string {
  return String(segments[0] ?? '');
}

export default function RouteGate() {
  const { isInitialized, isAuthenticated } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const {
    hasPremiumAccess,
    isEntitlementActive,
    isLoading: subscriptionLoading,
  } = useSubscription();
  const router = useRouter();
  const segments = useSegments();
  const lastTarget = useRef<string | null>(null);

  const gateState = useMemo(() => {
    const topRoute = getTopRoute(segments as string[]);
    const inAuth = topRoute === 'auth';
    const inOnboarding = topRoute === 'onboarding';
    const inPaywall = topRoute === 'upgrade';

    let target: string | null = null;
    let decision = 'loading-session';

    if (!isInitialized) {
      decision = 'loading-session';
    } else if (!isAuthenticated) {
      target = inAuth ? null : '/auth/welcome';
      decision = inAuth ? 'show-auth' : 'redirect-auth';
    } else if (profileLoading || !profile) {
      target = null;
      decision = 'loading-profile';
    } else if (!profile.onboarding_completed) {
      target = inOnboarding ? null : '/onboarding';
      decision = inOnboarding ? 'show-onboarding' : 'redirect-onboarding';
    } else if (subscriptionLoading) {
      target = null;
      decision = 'loading-access';
    } else if (!hasPremiumAccess) {
      target = inPaywall ? null : '/upgrade';
      decision = inPaywall ? 'show-paywall' : 'redirect-paywall';
    } else if (inAuth || inOnboarding || inPaywall) {
      target = '/';
      decision = 'redirect-main-app';
    } else {
      decision = 'allow-main-app';
    }

    return { topRoute, target, decision };
  }, [
    hasPremiumAccess,
    isAuthenticated,
    isInitialized,
    profile,
    profileLoading,
    segments,
    subscriptionLoading,
  ]);

  useEffect(() => {
    if (!isInitialized) return;

    const target = gateState.target;

    if (!target) {
      lastTarget.current = null;
      return;
    }

    if (lastTarget.current === target) return;
    lastTarget.current = target;

    const frame = requestAnimationFrame(() => {
      try {
        router.replace(target as never);
      } catch (e) {
        console.log('[RouteGate] replace error', e);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [
    gateState.target,
    isInitialized,
    router,
  ]);

  if (!__DEV__) return null;

  const trialActive = isProfileTrialActive(profile);

  return (
    <View pointerEvents="none" style={styles.debugPanel}>
      <Text style={styles.debugTitle}>Access Flow Debug</Text>
      <Text style={styles.debugText}>session: {isAuthenticated ? 'signed in' : 'signed out'}</Text>
      <Text style={styles.debugText}>
        onboarding_completed: {profile?.onboarding_completed === true ? 'true' : 'false'}
      </Text>
      <Text style={styles.debugText}>
        trial_ends_at: {profile?.trial_ends_at ?? 'none'}
      </Text>
      <Text style={styles.debugText}>trial active: {trialActive ? 'true' : 'false'}</Text>
      <Text style={styles.debugText}>
        premium active: {isEntitlementActive ? 'true' : 'false'}
      </Text>
      <Text style={styles.debugText}>route: /{gateState.topRoute || '(root)'}</Text>
      <Text style={styles.debugText}>decision: {gateState.decision}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  debugPanel: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 9999,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
  },
  debugTitle: {
    color: Colors.brandCyan,
    fontSize: 11,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  debugText: {
    color: Colors.text,
    fontSize: 10,
    lineHeight: 14,
  },
});
