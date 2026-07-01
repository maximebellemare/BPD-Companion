import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useUserProfile } from '@/providers/UserProfileProvider';
import { useProfile } from '@/providers/ProfileProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { isProfileTrialActive } from '@/lib/supabase/profiles';
import { supabaseConfig } from '@/lib/supabase/client';
import Colors from '@/constants/colors';
import BrandLogo from '@/components/branding/BrandLogo';

function getTopRoute(segments: string[]): string {
  return String(segments[0] ?? '');
}

function getExpectedTopRoute(target: string): string {
  if (target.startsWith('/auth')) return 'auth';
  if (target.startsWith('/onboarding')) return 'onboarding';
  if (target.startsWith('/upgrade')) return 'upgrade';
  if (target.startsWith('/(tabs)')) return '(tabs)';
  return target.replace(/^\//, '').split('/')[0] ?? '';
}

export default function RouteGate() {
  const { isInitialized, isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { isLoading: themeProfileLoading } = useProfile();
  const { colors } = useAppTheme();
  const {
    hasPremiumAccess,
    isEntitlementActive,
    isLoading: subscriptionLoading,
  } = useSubscription();
  const router = useRouter();
  const segments = useSegments();
  const lastTarget = useRef<string | null>(null);
  const [nativeSplashHidden, setNativeSplashHidden] = useState<boolean>(Platform.OS === 'web');
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  const gateState = useMemo(() => {
    const topRoute = getTopRoute(segments as string[]);
    const inAuth = topRoute === 'auth';
    const inOnboarding = topRoute === 'onboarding';
    const inPaywall = topRoute === 'upgrade';

    let target: string | null = null;
    let decision = 'loading-session';

    if (!isInitialized || authLoading || themeProfileLoading) {
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
    } else if (inAuth) {
      target = '/(tabs)/(home)';
      decision = 'redirect-main-app';
    } else if (inOnboarding) {
      target = null;
      decision = 'show-onboarding-replay';
    } else if (inPaywall) {
      target = null;
      decision = 'show-subscription-management';
    } else {
      decision = 'allow-main-app';
    }

    return { topRoute, target, decision };
  }, [
    authLoading,
    hasPremiumAccess,
    isAuthenticated,
    isInitialized,
    profile,
    profileLoading,
    segments,
    subscriptionLoading,
    themeProfileLoading,
  ]);

  useEffect(() => {
    if (!nativeSplashHidden && Platform.OS !== 'web') {
      void SplashScreen.hideAsync().finally(() => setNativeSplashHidden(true));
    }
  }, [nativeSplashHidden]);

  useEffect(() => {
    if (!isInitialized || authLoading || themeProfileLoading) return;

    const target = gateState.target;

    if (!target) {
      lastTarget.current = null;
      setPendingTarget(null);
      return;
    }

    if (lastTarget.current === target) return;
    lastTarget.current = target;
    setPendingTarget(target);

    const frame = requestAnimationFrame(() => {
      try {
        router.replace(target as never);
      } catch (e) {
        console.log('[RouteGate] replace error', e);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [
    authLoading,
    gateState.target,
    isInitialized,
    router,
    themeProfileLoading,
  ]);

  useEffect(() => {
    if (!pendingTarget) return;
    const expectedTopRoute = getExpectedTopRoute(pendingTarget);
    if (gateState.topRoute !== expectedTopRoute) return;
    const frame = requestAnimationFrame(() => setPendingTarget(null));
    return () => cancelAnimationFrame(frame);
  }, [gateState.topRoute, pendingTarget]);

  const shouldBlockRender =
    !nativeSplashHidden ||
    pendingTarget !== null ||
    gateState.decision.startsWith('loading') ||
    gateState.decision.startsWith('redirect');

  const trialActive = isProfileTrialActive(profile);

  return (
    <>
      {shouldBlockRender ? (
        <View
          pointerEvents="auto"
          style={[
            styles.loadingOverlay,
            {
              backgroundColor: colors.background,
            },
          ]}
          testID="route-gate-loading"
        >
          <BrandLogo size={88} animated />
          <Text style={[styles.loadingTitle, { color: colors.text }]}>BPD Companion</Text>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Preparing your space</Text>
          <ActivityIndicator size="small" color={colors.brandTeal} style={styles.loadingSpinner} />
        </View>
      ) : null}

      {__DEV__ ? (
        <View pointerEvents="none" style={styles.debugPanel}>
          <Text style={styles.debugTitle}>Access Flow Debug</Text>
          {supabaseConfig.error ? (
            <Text style={styles.configError}>Missing Supabase configuration</Text>
          ) : null}
          <Text style={styles.debugText}>session: {isAuthenticated ? 'signed in' : 'signed out'}</Text>
          <Text style={styles.debugText}>supabase url: {supabaseConfig.url ? 'set' : 'missing'}</Text>
          <Text style={styles.debugText}>supabase anon key: {supabaseConfig.hasAnonKey ? 'set' : 'missing'}</Text>
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
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    elevation: 9998,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loadingTitle: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: 0,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  loadingSpinner: {
    marginTop: 24,
  },
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
  configError: {
    color: Colors.danger,
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
