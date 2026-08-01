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
  Globe2,
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
import {
  getAndroidActivePeriodFromProductIdentifier,
  getIosActivePeriodFromProductIdentifier,
  getMembershipManagementRoute,
} from '@/services/subscription/membershipPrimaryActionModel';
import {
  CommunityProfile,
  loadCommunityProfile,
  saveCommunityProfile,
  validateUsername,
  normalizeUsername,
} from '@/services/community/communityProfileService';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';
import { SELECTABLE_LANGUAGES, SPANISH_LANGUAGE_SELECTION_ENABLED } from '@/lib/i18n/languageStorage';

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

function translateCommunityProfileError(message: string, translate: (key: string) => string): string {
  if (/at least 3 characters/i.test(message)) return translate('profile:community.errors.tooShort');
  if (/20 characters or fewer/i.test(message)) return translate('profile:community.errors.tooLong');
  if (/letters, numbers, and underscores/i.test(message)) return translate('profile:community.errors.invalidCharacters');
  if (/already taken/i.test(message)) return translate('profile:community.errors.taken');
  return message;
}

function getDaysUntil(timestamp: number | null | undefined): number {
  if (!timestamp) return 0;
  return Math.max(0, Math.ceil((timestamp - Date.now()) / (24 * 60 * 60 * 1000)));
}

function formatMembershipDate(timestamp: number | null | undefined, language?: string): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(language === 'es' ? 'es' : undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateNotifications, updatePrivacy } = useProfile();
  const { theme, colors: palette, setTheme } = useAppTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(['common', 'navigation', 'profile', 'subscription']);
  const { openManualReviewPrompt } = useReviewPrompt();
  const {
    isPremium,
    isEntitlementActive,
    activeProductIdentifier,
    activeWillRenew,
    activeBillingIssueDetectedAt,
    inactiveExpirationAt,
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

  const profileEmail = user?.email || t('profile:notSignedIn');
  const isOwnerQa = __DEV__ && user?.email?.toLowerCase() === OWNER_QA_EMAIL;
  const isExpoGo = Constants.appOwnership === 'expo';
  const activePeriodForStatus = Platform.OS === 'android'
    ? getAndroidActivePeriodFromProductIdentifier(activeProductIdentifier)
    : Platform.OS === 'ios'
      ? getIosActivePeriodFromProductIdentifier(activeProductIdentifier)
      : subscriptionState.plan?.period ?? null;

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
      setCommunityProfileError(translateCommunityProfileError(validation, t));
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
      setNotice(t('profile:community.saved'));
    } catch (error) {
      setCommunityProfileError(error instanceof Error ? translateCommunityProfileError(error.message, t) : t('profile:community.saveError'));
    } finally {
      setIsSavingCommunityProfile(false);
    }
  }, [communityAvatarColor, communityDisplayName, communityUsername, t, user]);
  const trialDaysRemaining = getDaysUntil(subscriptionState.trialEndsAt);
  const planLabel = activePeriodForStatus ? t(`subscription:plans.${activePeriodForStatus}`) : t('profile:membership.membershipTitle');
  const activeExpirationDateLabel = formatMembershipDate(subscriptionState.expiresAt, language);
  const billingIssueDateLabel = formatMembershipDate(activeBillingIssueDetectedAt, language);
  const inactiveExpirationDateLabel = formatMembershipDate(inactiveExpirationAt, language);

  const statusLabel = useMemo(() => {
    if (isExpoGo && !isEntitlementActive) return t('profile:membership.membershipTitle');
    if (activeBillingIssueDetectedAt && isEntitlementActive) return t('subscription:status.billingIssue');
    if (isEntitlementActive && subscriptionState.isTrialActive) return t('subscription:status.trialActiveTitle', { plan: planLabel });
    if (isEntitlementActive && activeWillRenew === false) return t('subscription:status.membershipCancelledTitle', { plan: planLabel });
    if (isEntitlementActive) return t('subscription:status.membershipActiveTitle', { plan: planLabel });
    if (inactiveExpirationAt) return t('subscription:status.membershipExpired');
    return t('profile:membership.startTitle');
  }, [
    activeBillingIssueDetectedAt,
    activeWillRenew,
    inactiveExpirationAt,
    isEntitlementActive,
    isExpoGo,
    planLabel,
    subscriptionState.isTrialActive,
    t,
  ]);

  const statusDescription = useMemo(() => {
    if (isExpoGo && !isEntitlementActive) {
      return t('profile:membership.expoLocalDescription');
    }
    if (activeBillingIssueDetectedAt && isEntitlementActive) {
      return t('subscription:status.billing', {
        plan: planLabel,
        dateText: billingIssueDateLabel ? ` ${language === 'es' ? 'el' : 'on'} ${billingIssueDateLabel}` : '',
      });
    }
    if (isEntitlementActive && subscriptionState.isTrialActive) {
      if (trialDaysRemaining === 1) return t('subscription:status.trialOneDay', { plan: planLabel });
      if (trialDaysRemaining > 1) return t('subscription:status.trialDays', { plan: planLabel, count: trialDaysRemaining });
      return t('subscription:status.trial', { plan: planLabel, date: activeExpirationDateLabel ?? t('subscription:status.renewalDate') });
    }
    if (isEntitlementActive && activeWillRenew === false) {
      return activeExpirationDateLabel
        ? t('subscription:status.cancelled', { plan: planLabel, date: activeExpirationDateLabel })
        : t('subscription:status.cancelledNoDate', { plan: planLabel });
    }
    if (isEntitlementActive) {
      return activeExpirationDateLabel
        ? t('subscription:status.renews', { plan: planLabel, date: activeExpirationDateLabel })
        : t('subscription:status.activeNoDate', { plan: planLabel });
    }
    if (inactiveExpirationAt) {
      return t('subscription:status.expired', { date: inactiveExpirationDateLabel ?? t('subscription:status.renewalDate') });
    }
    return t('subscription:status.startMembershipBody');
  }, [
    activeBillingIssueDetectedAt,
    activeExpirationDateLabel,
    activeWillRenew,
    billingIssueDateLabel,
    inactiveExpirationAt,
    inactiveExpirationDateLabel,
    isEntitlementActive,
    isExpoGo,
    language,
    planLabel,
    subscriptionState.isTrialActive,
    t,
    trialDaysRemaining,
  ]);

  const handleResetPassword = useCallback(() => {
    if (!user?.email) {
      Alert.alert(t('profile:account.emailRequiredTitle'), t('profile:account.emailRequiredMessage'));
      return;
    }
    const sendReset = async () => {
      setNotice(null);
      try {
        await resetPassword(user.email);
        setNotice(t('profile:account.resetSent', { email: user.email }));
      } catch (error) {
        Alert.alert(
          t('profile:account.resetFailedTitle'),
          error instanceof Error ? error.message : t('profile:account.resetFailedMessage'),
        );
      }
    };
    if (Platform.OS === 'web') {
      void sendReset();
      return;
    }
    Alert.alert(t('profile:account.sendResetTitle'), t('profile:account.sendResetMessage', { email: user.email }), [
      { text: t('common:cancel'), style: 'cancel' },
      { text: t('profile:account.send'), onPress: () => void sendReset() },
    ]);
  }, [resetPassword, t, user?.email]);

  const handleRestore = useCallback(() => {
    setNotice(null);
    restore()
      .then((active) => {
        setNotice(active ? t('profile:membership.restoreActive') : t('profile:membership.restoreInactive'));
      })
      .catch(() => {
        Alert.alert(t('profile:membership.restoreLoadingTitle'), t('profile:membership.restoreLoadingMessage'));
      });
  }, [restore, t]);

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
        setNotice(t('profile:appearance.tutorialReady'));
        router.push({
          pathname: '/(tabs)/(home)',
          params: { tutorial: '1' },
        } as never);
      })
      .catch((error) => Alert.alert(t('profile:appearance.tutorialFailedTitle'), error instanceof Error ? error.message : t('profile:accountControl.tryAgain')));
  }, [router, t]);

  const handleSignOut = useCallback(() => {
    const doSignOut = async () => {
      try {
        await signOut();
      } catch (error) {
        Alert.alert(t('profile:accountControl.logoutFailedTitle'), error instanceof Error ? error.message : t('profile:accountControl.tryAgain'));
      }
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(t('profile:accountControl.logoutConfirmWeb'))) {
        void doSignOut();
      }
      return;
    }
    Alert.alert(t('profile:accountControl.logoutTitle'), t('profile:accountControl.logoutMessage'), [
      { text: t('common:cancel'), style: 'cancel' },
      { text: t('profile:accountControl.logout'), style: 'destructive', onPress: () => void doSignOut() },
    ]);
  }, [signOut, t]);

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
            <Text style={styles.eyebrow}>{t('profile:header.eyebrow')}</Text>
            <Text style={[styles.headerTitle, { color: palette.text }]}>{t('profile:header.title')}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.accountCard, { opacity: fadeAnim, backgroundColor: palette.card, borderColor: palette.borderLight, shadowColor: palette.shadow }]}>
          <View style={styles.accountTopRow}>
            <View style={[styles.avatar, { backgroundColor: palette.primaryLight }]}>
              <User size={22} color={palette.primary} />
            </View>
            <View style={styles.accountText}>
              <Text style={[styles.accountLabel, { color: palette.textMuted }]}>{t('profile:header.signedInAs')}</Text>
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
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('profile:sections.subscription')}</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            {renderSettingsRow({
              icon: <Crown size={17} color={Colors.primary} />,
              title: subscriptionState.isTrialActive || isEntitlementActive
                ? t('profile:membership.manageTitle')
                : isExpoGo
                  ? t('profile:membership.membershipTitle')
                  : t('profile:membership.startTitle'),
              description: subscriptionState.isTrialActive
                ? t('profile:membership.trialDescription')
                : isEntitlementActive
                ? t('profile:membership.activeDescription')
                : isExpoGo
                  ? t('profile:membership.plansDescription')
                  : t('profile:membership.plansDescription'),
              onPress: handleManageSubscription,
              testID: 'manage-subscription-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <RefreshCw size={17} color={Colors.brandTeal} />,
              title: isRestoring ? t('profile:membership.restoringTitle') : t('profile:membership.restoreTitle'),
              description: t('profile:membership.restoreDescription'),
              onPress: handleRestore,
              testID: 'restore-purchases-btn',
            })}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('profile:sections.account')}</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            {renderSettingsRow({
              icon: <Mail size={17} color={Colors.accent} />,
              title: t('profile:account.email'),
              description: profileEmail,
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <Lock size={17} color={Colors.primary} />,
              title: t('profile:account.changePassword'),
              description: t('profile:account.changePasswordDescription'),
              onPress: handleResetPassword,
              testID: 'reset-password-btn',
            })}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('profile:sections.communityProfile')}</Text>
          <View style={[styles.card, styles.communityProfileCard, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            <View style={styles.communityProfileTop}>
              <View style={[styles.communityAvatarPreview, { backgroundColor: communityAvatarColor }]}>
                <Text style={styles.communityAvatarText}>
                  {(communityDisplayName || communityUsername || t('profile:you')).slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.communityProfileCopy}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>
                  {communityProfile ? `@${communityProfile.username}` : t('profile:community.setup')}
                </Text>
                <Text style={[styles.rowDescription, { color: palette.textSecondary }]}>
                  {t('profile:community.description')}
                </Text>
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>{t('profile:community.username')}</Text>
            <TextInput
              style={[styles.profileInput, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.borderLight }]}
              value={communityUsername}
              onChangeText={(value) => {
                setCommunityUsername(normalizeUsername(value));
                setCommunityProfileError(null);
                setCommunityProfileSaved(false);
              }}
              placeholder={t('profile:community.usernamePlaceholder')}
              placeholderTextColor={palette.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              testID="community-username-input"
            />
            <Text style={[styles.inputHelp, { color: palette.textMuted }]}>{t('profile:community.usernameHelp')}</Text>

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>{t('profile:community.displayName')}</Text>
            <TextInput
              style={[styles.profileInput, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.borderLight }]}
              value={communityDisplayName}
              onChangeText={(value) => {
                setCommunityDisplayName(value);
                setCommunityProfileSaved(false);
              }}
              placeholder={t('profile:community.displayNamePlaceholder')}
              placeholderTextColor={palette.textMuted}
              maxLength={40}
              testID="community-display-name-input"
            />

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>{t('profile:community.avatarColor')}</Text>
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
                {isSavingCommunityProfile ? t('profile:community.saving') : communityProfileSaved ? t('profile:community.saved') : communityProfile ? t('profile:community.save') : t('profile:community.create')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('profile:sections.notifications')}</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            {renderSettingsRow({
              icon: <Bell size={17} color={Colors.brandTeal} />,
              title: t('profile:notifications.settings'),
              description: t('profile:notifications.summary', {
                frequency: t(`profile:notifications.frequencies.${profile.notifications.frequency ?? 'balanced'}`),
                quietHours: profile.notifications.quietHoursEnabled ? t('profile:notifications.quietOn') : t('profile:notifications.quietOff'),
              }),
              onPress: () => router.push('/profile/notification-preferences' as never),
              testID: 'notification-preferences-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            <View style={styles.settingsRow}>
              <View style={styles.rowIcon}>
                <Bell size={17} color={Colors.accent} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>{t('profile:notifications.dailyReminder')}</Text>
                <Text style={[styles.rowDescription, { color: palette.textSecondary }]}>{t('profile:notifications.dailyReminderDescription')}</Text>
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
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('profile:sections.appearance')}</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            {SPANISH_LANGUAGE_SELECTION_ENABLED && (
              <>
                <View style={styles.themeHeader}>
                  <View style={styles.rowIcon}>
                    <Globe2 size={17} color={Colors.brandTeal} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, { color: palette.text }]}>{t('profile:appearance.language')}</Text>
                    <Text style={[styles.rowDescription, { color: palette.textSecondary }]}>
                      {language === 'es' ? t('common:spanish') : t('common:english')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.segmentedControl, { backgroundColor: palette.surface }]}>
                  {SELECTABLE_LANGUAGES.map((option) => {
                    const active = language === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.segmentButton, { backgroundColor: palette.surface, borderColor: palette.border }, active && { backgroundColor: palette.primary, borderColor: palette.primary }]}
                        onPress={() => {
                          handleHaptic();
                          void setLanguage(option);
                        }}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        testID={`profile-language-${option}`}
                      >
                        <Text style={[styles.segmentText, { color: palette.textSecondary }, active && { color: palette.white }]}>
                          {option === 'es' ? t('common:spanish') : t('common:english')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
              </>
            )}
            <View style={styles.themeHeader}>
              <View style={styles.rowIcon}>
                <Sun size={17} color={Colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>{t('profile:appearance.theme')}</Text>
                <Text style={[styles.rowDescription, { color: palette.textSecondary }]}>{t('profile:appearance.themeDescription')}</Text>
              </View>
            </View>
            <View style={[styles.segmentedControl, { backgroundColor: palette.surface }]}>
              {[
                { id: 'light', label: t('profile:appearance.light'), icon: Sun },
                { id: 'dark', label: t('profile:appearance.dark'), icon: Moon },
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
              title: t('profile:appearance.replayTutorial'),
              description: t('profile:appearance.replayTutorialDescription'),
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
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('profile:sections.privacySafety')}</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            <View style={styles.settingsRow}>
              <View style={styles.rowIcon}>
                <Shield size={17} color={Colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>{t('profile:privacy.shareContext')}</Text>
                <Text style={[styles.rowDescription, { color: palette.textSecondary }]}>{t('profile:privacy.shareContextDescription')}</Text>
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
              title: t('profile:privacy.medicalDisclaimer'),
              description: t('profile:privacy.medicalDisclaimerDescription'),
              onPress: () => router.push('/mental-health-disclaimer' as never),
              testID: 'medical-disclaimer-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <Shield size={17} color={Colors.danger} />,
              title: t('profile:privacy.crisisSettings'),
              description: t('profile:privacy.crisisSettingsDescription'),
              onPress: () => router.push('/profile/crisis-settings' as never),
              testID: 'crisis-settings-btn',
            })}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('profile:sections.legalHelp')}</Text>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
            {renderSettingsRow({
              icon: <Shield size={17} color={Colors.brandTeal} />,
              title: t('profile:legal.privacyPolicy'),
              description: t('profile:legal.privacyPolicyDescription'),
              onPress: () => router.push('/privacy-policy' as never),
              testID: 'privacy-policy-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <FileText size={17} color={Colors.primary} />,
              title: t('profile:legal.terms'),
              description: t('profile:legal.termsDescription'),
              onPress: () => router.push('/terms-of-service' as never),
              testID: 'terms-of-use-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <HelpCircle size={17} color={Colors.accent} />,
              title: t('profile:legal.support'),
              description: t('profile:legal.supportDescription'),
              onPress: () => router.push('/support-feedback' as never),
              testID: 'contact-support-btn',
            })}
            <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
            {renderSettingsRow({
              icon: <Star size={17} color={Colors.brandTeal} />,
              title: t('profile:legal.rate'),
              description: t('profile:legal.rateDescription'),
              onPress: openManualReviewPrompt,
              testID: 'rate-app-btn',
            })}
          </View>
        </Animated.View>

        {isAuthenticated ? (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('profile:sections.accountControl')}</Text>
            <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.borderLight }]}>
              {renderSettingsRow({
                icon: <Trash2 size={17} color={Colors.danger} />,
                title: t('profile:accountControl.delete'),
                description: t('profile:accountControl.deleteDescription'),
                onPress: () => router.push('/data-deletion' as never),
                testID: 'delete-account-btn',
                destructive: true,
              })}
              <View style={[styles.divider, { backgroundColor: palette.borderLight }]} />
              {renderSettingsRow({
                icon: <LogOut size={17} color={Colors.danger} />,
                title: t('profile:accountControl.logout'),
                description: t('profile:accountControl.logoutDescription'),
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
