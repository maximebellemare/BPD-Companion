import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Crown,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  Mail,
  Moon,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  Sun,
  Trash2,
  User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import BrandLogo from '@/components/branding/BrandLogo';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/providers/ProfileProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useUserProfile } from '@/providers/UserProfileProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useReviewPrompt } from '@/providers/ReviewPromptProvider';
import { updateProfile as updateAccountProfile } from '@/lib/supabase/profiles';
import { storageService } from '@/services/storage/storageService';
import { resetTodayTutorial } from '@/services/habits/tutorialAndRewardsService';
import { getMembershipManagementRoute } from '@/services/subscription/membershipPrimaryActionModel';
import {
  CommunityProfile,
  loadCommunityProfile,
  saveCommunityProfile,
  validateUsername,
  normalizeUsername,
} from '@/services/community/communityProfileService';

const OWNER_QA_EMAIL = 'valmontmarketing@gmail.com';
const AVATAR_COLORS = ['#2E2A72', '#3B82F6', '#14B8A6', '#67E8F9', '#059669'];

type SettingsRowProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress?: () => void;
  testID?: string;
  right?: React.ReactNode;
  destructive?: boolean;
};

function getDaysUntil(timestamp: number | null | undefined): number {
  if (!timestamp) return 0;
  return Math.max(0, Math.ceil((timestamp - Date.now()) / (24 * 60 * 60 * 1000)));
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateNotifications, updatePrivacy } = useProfile();
  const { theme, colors: palette, setTheme } = useAppTheme();
  const { openManualReviewPrompt } = useReviewPrompt();
  const {
    isPremium,
    isEntitlementActive,
    isRestoring,
    restore,
    restoreError,
    state: subscriptionState,
  } = useSubscription();
  const { profile: accountProfile, refreshProfile: refreshAccountProfile } = useUserProfile();
  const { user, isAuthenticated, resetPassword, signOut } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);
  const [communityProfile, setCommunityProfile] = useState<CommunityProfile | null>(null);
  const [communityUsername, setCommunityUsername] = useState('');
  const [communityDisplayName, setCommunityDisplayName] = useState('');
  const [communityAvatarColor, setCommunityAvatarColor] = useState(AVATAR_COLORS[0]);
  const [communityProfileError, setCommunityProfileError] = useState<string | null>(null);
  const [isSavingCommunityProfile, setIsSavingCommunityProfile] = useState(false);
  const [communityProfileSaved, setCommunityProfileSaved] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const profileEmail = user?.email || 'Not signed in';
  const isOwnerQa = __DEV__ && user?.email?.toLowerCase() === OWNER_QA_EMAIL;
  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    let mounted = true;
    loadCommunityProfile()
      .then((profile) => {
        if (!mounted) return;
        const hydrated = profile ?? (accountProfile?.username ? {
          username: accountProfile.username,
          displayName: accountProfile.display_name ?? undefined,
          avatarColor: accountProfile.avatar_color ?? AVATAR_COLORS[0],
          updatedAt: Date.now(),
        } : null);
        setCommunityProfile(hydrated);
        setCommunityUsername(hydrated?.username ?? '');
        setCommunityDisplayName(hydrated?.displayName ?? '');
        setCommunityAvatarColor(hydrated?.avatarColor ?? AVATAR_COLORS[0]);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [accountProfile?.avatar_color, accountProfile?.display_name, accountProfile?.username]);

  const handleSaveCommunityProfile = useCallback(async () => {
    const normalized = normalizeUsername(communityUsername);
    const validation = validateUsername(normalized);
    if (validation) {
      setCommunityProfileError(validation);
      return;
    }
    setIsSavingCommunityProfile(true);
    setCommunityProfileError(null);
    try {
      const saved = await saveCommunityProfile({
        username: normalized,
        displayName: communityDisplayName,
        avatarColor: communityAvatarColor,
      });
      setCommunityProfile(saved);
      setCommunityUsername(saved.username);
      setCommunityDisplayName(saved.displayName ?? '');
      setCommunityAvatarColor(saved.avatarColor);
      if (user) {
        try {
          await updateAccountProfile(user.id, {
            username: saved.username,
            display_name: saved.displayName ?? null,
            avatar_color: saved.avatarColor,
          });
        } catch (profileError) {
          const message = profileError instanceof Error ? profileError.message : '';
          if (/avatar_color|schema cache|column/i.test(message)) {
            await updateAccountProfile(user.id, {
              username: saved.username,
              display_name: saved.displayName ?? null,
            });
          } else {
            throw profileError;
          }
        }
      }
      setCommunityProfileSaved(true);
      setNotice('Saved');
    } catch (error) {
      setCommunityProfileError(error instanceof Error ? error.message : 'Could not save community profile.');
    } finally {
      setIsSavingCommunityProfile(false);
    }
  }, [communityAvatarColor, communityDisplayName, communityUsername, user]);
  const trialDaysRemaining = getDaysUntil(subscriptionState.trialEndsAt);
  const statusLabel = useMemo(() => {
    if (subscriptionState.isTrialActive) {
      return 'Membership active';
    }
    if (isEntitlementActive) return 'Membership active';
    if (isExpoGo) return 'Membership';
    return 'Subscription required';
  }, [isEntitlementActive, isExpoGo, subscriptionState.isTrialActive]);

  const statusDescription = useMemo(() => {
    if (subscriptionState.isTrialActive) {
      return trialDaysRemaining === 1
        ? 'Your 3-day trial is active and ends in 1 day.'
        : `Your 3-day trial is active and ends in ${trialDaysRemaining} days.`;
    }
    if (isEntitlementActive) {
      return 'Your membership is active. Companion, Insights, and regulation tools are unlocked.';
    }
    if (isExpoGo) {
      return 'View membership plans, restore purchases, or manage access.';
    }
    return 'Start your membership to use BPD Companion after onboarding.';
  }, [isEntitlementActive, isExpoGo, subscriptionState.isTrialActive, trialDaysRemaining]);

  const handleResetPassword = useCallback(() => {
    if (!user?.email) {
      Alert.alert('Email required', 'Sign in with an email address to reset your password.');
      return;
    }
    const sendReset = async () => {
      setNotice(null);
      try {
        await resetPassword(user.email);
        setNotice(`Password reset email sent to ${user.email}.`);
      } catch (error) {
        Alert.alert(
          'Reset failed',
          error instanceof Error ? error.message : 'We could not send a password reset email.',
        );
      }
    };
    if (Platform.OS === 'web') {
      void sendReset();
      return;
    }
    Alert.alert('Send password reset?', `We will email reset instructions to ${user.email}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: () => void sendReset() },
    ]);
  }, [resetPassword, user?.email]);

  const handleRestore = useCallback(() => {
    setNotice(null);
    restore()
      .then((active) => {
        setNotice(active ? 'Subscription restored. Membership is active.' : 'No active membership was found.');
      })
      .catch(() => {
        Alert.alert('Restore purchase', 'Membership options are loading. Please try again in a moment.');
      });
  }, [restore]);

  const handleManageSubscription = useCallback(() => {
    setNotice(null);
    router.push(getMembershipManagementRoute() as never);
  }, [router]);

  const updateOwnerAccountProfile = useCallback(async (updates: Parameters<typeof updateAccountProfile>[1]) => {
    if (!user || !isOwnerQa) return;
    await updateAccountProfile(user.id, updates);
    await refreshAccountProfile();
  }, [isOwnerQa, refreshAccountProfile, user]);

  const handleResetOnboarding = useCallback(() => {
    updateOwnerAccountProfile({ onboarding_completed: false, onboarding_answers: null })
      .then(() => setNotice('QA: onboarding reset for this account.'))
      .catch((error) => Alert.alert('QA action failed', error instanceof Error ? error.message : 'Please try again.'));
  }, [updateOwnerAccountProfile]);

  const handleRestartTrial = useCallback(() => {
    const started = new Date();
    const ends = new Date(started);
    ends.setUTCDate(ends.getUTCDate() + 7);
    updateOwnerAccountProfile({
      trial_started_at: started.toISOString(),
      trial_ends_at: ends.toISOString(),
    })
      .then(() => setNotice('QA: legacy profile trial metadata refreshed. Store membership still controls access.'))
      .catch((error) => Alert.alert('QA action failed', error instanceof Error ? error.message : 'Please try again.'));
  }, [updateOwnerAccountProfile]);

  const handleForceTrialExpired = useCallback(() => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    updateOwnerAccountProfile({ trial_ends_at: yesterday.toISOString() })
      .then(() => setNotice('QA: legacy profile trial forced expired. Store membership still controls access.'))
      .catch((error) => Alert.alert('QA action failed', error instanceof Error ? error.message : 'Please try again.'));
  }, [updateOwnerAccountProfile]);

  const handleClearLocalState = useCallback(() => {
    storageService.clearLocalForCurrentUser()
      .then(() => setNotice('QA: local app state/cache cleared. Restart the app to reload from cloud.'))
      .catch((error) => Alert.alert('QA action failed', error instanceof Error ? error.message : 'Please try again.'));
  }, []);

  const handleReplayTutorial = useCallback(() => {
    resetTodayTutorial()
      .then(() => {
        setNotice('App tutorial ready to replay.');
        router.push({
          pathname: '/(tabs)/(home)',
          params: { tutorial: '1' },
        } as never);
      })
      .catch((error) => Alert.alert('Could not replay tutorial', error instanceof Error ? error.message : 'Please try again.'));
  }, [router]);

  const handleSignOut = useCallback(() => {
    const doSignOut = async () => {
      try {
        await signOut();
      } catch (error) {
        Alert.alert('Logout failed', error instanceof Error ? error.message : 'Please try again.');
      }
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Log out of BPD Companion?')) {
        void doSignOut();
      }
      return;
    }
    Alert.alert('Log out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void doSignOut() },
    ]);
  }, [signOut]);

  const renderSettingsRow = useCallback(({
    icon,
    title,
    description,
    onPress,
    testID,
    right,
    destructive,
  }: SettingsRowProps) => {
    const content = (
      <>
        <View style={[styles.rowIcon, { backgroundColor: palette.surface }, destructive && styles.rowIconDanger]}>{icon}</View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: destructive ? palette.danger : palette.text }]}>{title}</Text>
          <Text style={[styles.rowDescription, { color: palette.textSecondary }]}>{description}</Text>
        </View>
        {right ?? (onPress ? <ChevronRight size={18} color={palette.textMuted} /> : null)}
      </>
    );

    if (!onPress) {
      return <View style={[styles.settingsRow, { backgroundColor: palette.card }]}>{content}</View>;
    }

    return (
      <TouchableOpacity
        style={[styles.settingsRow, { backgroundColor: palette.card }]}
        activeOpacity={0.72}
        onPress={() => {
          handleHaptic();
          onPress();
        }}
        testID={testID}
      >
        {content}
      </TouchableOpacity>
    );
  }, [
    handleHaptic,
    palette.card,
    palette.danger,
    palette.surface,
    palette.text,
    palette.textMuted,
    palette.textSecondary,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.logoWrap, { backgroundColor: palette.card, borderColor: palette.borderLight, shadowColor: palette.shadow }]}>
            <BrandLogo size={42} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Account</Text>
            <Text style={[styles.headerTitle, { color: palette.text }]}>Profile & settings</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.accountCard, { opacity: fadeAnim, backgroundColor: palette.card, borderColor: palette.borderLight, shadowColor: palette.shadow }]}>
          <View style={styles.accountTopRow}>
            <View style={[styles.avatar, { backgroundColor: palette.primaryLight }]}>
              <User size={22} color={palette.primary} />
            </View>
            <View style={styles.accountText}>
              <Text style={[styles.accountLabel, { color: palette.textMuted }]}>Signed in as</Text>
              <Text style={[styles.accountEmail, { color: palette.text }]} numberOfLines={1}>{profileEmail}</Text>
            </View>
          </View>
          <View style={[styles.statusPanel, { backgroundColor: palette.surface }]}>
            <View style={[styles.statusIcon, { backgroundColor: palette.card }]}>
              <Crown size={18} color={isPremium ? palette.brandTeal : palette.primary} />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={[styles.statusTitle, { color: palette.text }]}>{statusLabel}</Text>
              <Text style={[styles.statusDescription, { color: palette.textSecondary }]}>{statusDescription}</Text>
            </View>
          </View>
        </Animated.View>

        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        {restoreError ? <Text style={styles.errorText}>{restoreError}</Text> : null}

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>SUBSCRIPTION</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            {renderSettingsRow({
              icon: <Crown size={17} color={Colors.primary} />,
              title: subscriptionState.isTrialActive || isEntitlementActive
                ? 'Manage Membership'
                : isExpoGo
                  ? 'Membership'
                  : 'Start your membership',
              description: subscriptionState.isTrialActive
                ? 'Your 3-day trial is active. Manage your membership anytime.'
                : isEntitlementActive
                ? 'View plans, renewal details, and membership access.'
                : isExpoGo
                  ? 'View monthly and yearly membership plans.'
                  : 'View monthly and yearly membership plans.',
              onPress: handleManageSubscription,
              testID: 'manage-subscription-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <RefreshCw size={17} color={Colors.brandTeal} />,
              title: isRestoring ? 'Restoring purchases...' : 'Restore purchases',
              description: 'Recover an active App Store or Google Play subscription.',
              onPress: handleRestore,
              testID: 'restore-purchases-btn',
            })}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            {renderSettingsRow({
              icon: <Mail size={17} color={Colors.accent} />,
              title: 'Email',
              description: profileEmail,
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <Lock size={17} color={Colors.primary} />,
              title: 'Change password',
              description: 'Send a secure password reset email.',
              onPress: handleResetPassword,
              testID: 'reset-password-btn',
            })}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>COMMUNITY PROFILE</Text>
          <View style={[styles.card, styles.communityProfileCard, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            <View style={styles.communityProfileTop}>
              <View style={[styles.communityAvatarPreview, { backgroundColor: communityAvatarColor }]}>
                <Text style={styles.communityAvatarText}>
                  {(communityDisplayName || communityUsername || 'You').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.communityProfileCopy}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>
                  {communityProfile ? `@${communityProfile.username}` : 'Set up community profile'}
                </Text>
                <Text style={[styles.rowDescription, { color: palette.textSecondary }]}>
                  Community shows your username or display name, never your email.
                </Text>
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Username</Text>
            <TextInput
              style={[styles.profileInput, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.borderLight }]}
              value={communityUsername}
              onChangeText={(value) => {
                setCommunityUsername(normalizeUsername(value));
                setCommunityProfileError(null);
                setCommunityProfileSaved(false);
              }}
              placeholder="username"
              placeholderTextColor={palette.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              testID="community-username-input"
            />
            <Text style={[styles.inputHelp, { color: palette.textMuted }]}>3-20 characters. Letters, numbers, and underscores only.</Text>

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Display name optional</Text>
            <TextInput
              style={[styles.profileInput, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.borderLight }]}
              value={communityDisplayName}
              onChangeText={(value) => {
                setCommunityDisplayName(value);
                setCommunityProfileSaved(false);
              }}
              placeholder="What people can call you"
              placeholderTextColor={palette.textMuted}
              maxLength={40}
              testID="community-display-name-input"
            />

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Avatar color</Text>
            <View style={styles.avatarColorRow}>
              {AVATAR_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.avatarColorSwatch,
                    { backgroundColor: color, borderColor: communityAvatarColor === color ? palette.text : 'transparent' },
                  ]}
                  onPress={() => {
                    setCommunityAvatarColor(color);
                    setCommunityProfileSaved(false);
                  }}
                  activeOpacity={0.78}
                  testID={`avatar-color-${color}`}
                />
              ))}
            </View>

            {communityProfileError ? <Text style={styles.errorText}>{communityProfileError}</Text> : null}

            <TouchableOpacity
              style={[styles.saveCommunityButton, { backgroundColor: palette.primary }]}
              onPress={handleSaveCommunityProfile}
              disabled={isSavingCommunityProfile}
              activeOpacity={0.84}
              testID="save-community-profile-btn"
            >
              <Text style={styles.saveCommunityButtonText}>
                {isSavingCommunityProfile ? 'Saving...' : communityProfileSaved ? 'Saved' : communityProfile ? 'Save community profile' : 'Create community profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>NOTIFICATIONS</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            {renderSettingsRow({
              icon: <Bell size={17} color={Colors.brandTeal} />,
              title: 'Notification settings',
              description: `${titleCase(profile.notifications.frequency ?? 'balanced')} frequency · ${profile.notifications.quietHoursEnabled ? 'Quiet hours on' : 'Quiet hours off'}`,
              onPress: () => router.push('/profile/notification-preferences' as never),
              testID: 'notification-preferences-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            <View style={styles.settingsRow}>
              <View style={styles.rowIcon}>
                <Bell size={17} color={Colors.accent} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>Daily check-in reminder</Text>
                <Text style={[styles.rowDescription, { color: palette.textSecondary }]}>A gentle prompt to keep the habit alive.</Text>
              </View>
              <Switch
                value={profile.notifications.dailyCheckInReminder}
                onValueChange={(value) => updateNotifications({ dailyCheckInReminder: value })}
                trackColor={{ false: Colors.border, true: Colors.accentLight }}
                thumbColor={profile.notifications.dailyCheckInReminder ? Colors.accent : Colors.textMuted}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            <View style={styles.themeHeader}>
              <View style={styles.rowIcon}>
                <Sun size={17} color={Colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>Theme preference</Text>
                <Text style={[styles.rowDescription, { color: palette.textSecondary }]}>Choose a bright or dark interface.</Text>
              </View>
            </View>
            <View style={[styles.segmentedControl, { backgroundColor: palette.surface }]}>
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
              ].map((option) => {
                const Icon = option.icon;
                const active = theme === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.segmentButton, { backgroundColor: palette.surface, borderColor: palette.border }, active && { backgroundColor: palette.primary, borderColor: palette.primary }]}
                    onPress={() => {
                      handleHaptic();
                      setTheme(option.id as 'light' | 'dark');
                    }}
                    activeOpacity={0.8}
                    testID={`theme-${option.id}-btn`}
                  >
                    <Icon size={14} color={active ? palette.white : palette.textSecondary} />
                    <Text style={[styles.segmentText, { color: palette.textSecondary }, active && { color: palette.white }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <Sparkles size={17} color={Colors.brandTeal} />,
              title: 'Replay app tutorial',
              description: 'Review Today, Companion, Tools, Insights, Community, and Profile settings.',
              onPress: handleReplayTutorial,
              testID: 'replay-onboarding-tutorial-btn',
            })}
          </View>
        </Animated.View>

        {isOwnerQa ? (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>OWNER QA</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
              {renderSettingsRow({
                icon: <RefreshCw size={17} color={Colors.primary} />,
                title: 'Reset onboarding',
                description: 'Show onboarding again for this owner account.',
                onPress: handleResetOnboarding,
                testID: 'qa-reset-onboarding-btn',
              })}
              <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
              {renderSettingsRow({
                icon: <Crown size={17} color={Colors.brandTeal} />,
                title: 'Refresh legacy trial metadata',
                description: 'Updates profile trial fields only. Store membership still controls access.',
                onPress: handleRestartTrial,
                testID: 'qa-restart-trial-btn',
              })}
              <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
              {renderSettingsRow({
                icon: <AlertTriangle size={17} color={Colors.danger} />,
                title: 'Force trial expired',
                description: 'Sets legacy profile trial end to yesterday. Store membership still controls access.',
                onPress: handleForceTrialExpired,
                testID: 'qa-force-expired-btn',
              })}
              <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
              {renderSettingsRow({
                icon: <Trash2 size={17} color={Colors.danger} />,
                title: 'Clear local app state/cache',
                description: 'Clear local scoped data on this device only.',
                onPress: handleClearLocalState,
                testID: 'qa-clear-local-btn',
              })}
              <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
              {renderSettingsRow({
                icon: <ChevronRight size={17} color={Colors.primary} />,
                title: 'Go to onboarding',
                description: 'Open the onboarding flow directly.',
                onPress: () => router.push('/onboarding' as never),
                testID: 'qa-go-onboarding-btn',
              })}
              <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
              {renderSettingsRow({
                icon: <Sparkles size={17} color={Colors.brandTeal} />,
                title: 'Replay Today tutorial',
                description: 'Reset the first-visit tutorial for owner QA.',
                onPress: handleReplayTutorial,
                testID: 'qa-replay-tutorial-btn',
              })}
            </View>
          </Animated.View>
        ) : null}

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>PRIVACY & SAFETY</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            <View style={styles.settingsRow}>
              <View style={styles.rowIcon}>
                <Shield size={17} color={Colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>Share context with AI Companion</Text>
                <Text style={[styles.rowDescription, { color: palette.textSecondary }]}>Allow the AI to reference your saved patterns.</Text>
              </View>
              <Switch
                value={profile.privacy.shareInsightsWithCompanion}
                onValueChange={(value) => updatePrivacy({ shareInsightsWithCompanion: value })}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={profile.privacy.shareInsightsWithCompanion ? Colors.primary : Colors.textMuted}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <AlertTriangle size={17} color={Colors.danger} />,
              title: 'Medical disclaimer / crisis resources',
              description: 'Read safety guidance and find urgent support options.',
              onPress: () => router.push('/mental-health-disclaimer' as never),
              testID: 'medical-disclaimer-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <Shield size={17} color={Colors.danger} />,
              title: 'Crisis support settings',
              description: 'Emergency contacts and crisis support preferences.',
              onPress: () => router.push('/profile/crisis-settings' as never),
              testID: 'crisis-settings-btn',
            })}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>LEGAL & HELP</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            {renderSettingsRow({
              icon: <Shield size={17} color={Colors.brandTeal} />,
              title: 'Privacy Policy',
              description: 'How your information is protected and used.',
              onPress: () => router.push('/privacy-policy' as never),
              testID: 'privacy-policy-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <FileText size={17} color={Colors.primary} />,
              title: 'Terms of Use',
              description: 'Subscription, account, and app usage terms.',
              onPress: () => router.push('/terms-of-service' as never),
              testID: 'terms-of-use-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <HelpCircle size={17} color={Colors.accent} />,
              title: 'Contact support',
              description: 'Get help, report a problem, or send feedback.',
              onPress: () => router.push('/support-feedback' as never),
              testID: 'contact-support-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <Star size={17} color={Colors.brandTeal} />,
              title: 'Rate BPD Companion',
              description: 'Share an honest review if the app has been helpful.',
              onPress: openManualReviewPrompt,
              testID: 'rate-app-btn',
            })}
          </View>
        </Animated.View>

        {isAuthenticated ? (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>ACCOUNT CONTROL</Text>
            <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
              {renderSettingsRow({
                icon: <Trash2 size={17} color={Colors.danger} />,
                title: 'Delete account',
                description: 'Request account and personal data deletion.',
                onPress: () => router.push('/data-deletion' as never),
                testID: 'delete-account-btn',
                destructive: true,
              })}
              <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
              {renderSettingsRow({
                icon: <LogOut size={17} color={Colors.danger} />,
                title: 'Logout',
                description: 'Sign out of this device.',
                onPress: handleSignOut,
                testID: 'logout-btn',
                destructive: true,
              })}
            </View>
          </Animated.View>
        ) : null}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  logoWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: Colors.brandTeal,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 0,
  },
  accountCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
  },
  accountTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: {
    flex: 1,
  },
  accountLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  accountEmail: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statusPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 13,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  statusDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  noticeText: {
    color: Colors.success,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  errorText: {
    color: Colors.danger,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  themeDebugText: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: -6,
    marginBottom: 12,
    textAlign: 'center',
  },
  section: {
    marginTop: 18,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 9,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    shadowColor: 'rgba(16, 42, 67, 0.06)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 1,
  },
  communityProfileCard: {
    padding: 16,
    overflow: 'visible',
  },
  communityProfileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  communityAvatarPreview: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityAvatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  communityProfileCopy: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 7,
  },
  profileInput: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputHelp: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  avatarColorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  avatarColorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
  },
  saveCommunityButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveCommunityButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  settingsRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: Colors.white,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  rowIconDanger: {
    backgroundColor: Colors.dangerLight,
    borderColor: 'rgba(220, 38, 38, 0.16)',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  rowTitleDanger: {
    color: Colors.danger,
  },
  rowDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 62,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  segmentText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: Colors.white,
  },
});
