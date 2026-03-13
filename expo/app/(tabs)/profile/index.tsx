import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  User,
  Heart,
  Shield,
  Bell,
  Lock,
  ChevronRight,
  TrendingUp,
  Clock,
  Flame,
  Activity,
  Target,
  Sparkles,
  Phone,
  BarChart3,
  Users,
  Award,
  Calendar,
  FileText,
  Crown,
  Compass,
  HeartHandshake,
  Fingerprint,
  Brain,
  BookOpen,
  Bug,
  RefreshCw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useProfile } from '@/providers/ProfileProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useCoaching } from '@/hooks/useCoaching';
import { usePersonalization } from '@/hooks/usePersonalization';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, patternSummary, updateProfile, updateNotifications, updatePrivacy } = useProfile();
  const { isPremium, daysRemaining, state: subState } = useSubscription();
  const { wins } = useCoaching();
  const personalization = usePersonalization();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const daysSinceJoined = Math.max(1, Math.floor((Date.now() - profile.createdAt) / (24 * 60 * 60 * 1000)));

  const renderNavRow = useCallback((
    icon: React.ReactNode,
    title: string,
    desc: string,
    onPress: () => void,
    testId?: string,
    badge?: React.ReactNode,
  ) => (
    <TouchableOpacity
      style={styles.navRow}
      onPress={() => { handleHaptic(); onPress(); }}
      activeOpacity={0.7}
      testID={testId}
    >
      {icon}
      <View style={styles.navRowText}>
        <View style={styles.navRowTitleRow}>
          <Text style={styles.navRowTitle}>{title}</Text>
          {badge}
        </View>
        <Text style={styles.navRowDesc}>{desc}</Text>
      </View>
      <ChevronRight size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  ), [handleHaptic]);

  const premiumBadge = (
    <View style={styles.premiumBadge}>
      <Crown size={10} color="#D4956A" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerTop}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User size={24} color={Colors.primary} />
              </View>
              {isPremium && (
                <View style={styles.premiumAvatarBadge}>
                  <Crown size={10} color="#D4956A" />
                </View>
              )}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                {profile.displayName || 'Your Profile'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {daysSinceJoined} day{daysSinceJoined !== 1 ? 's' : ''} of showing up for yourself
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primaryLight }]}>
              <Flame size={14} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{patternSummary.journalStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.accentLight }]}>
              <Target size={14} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>{patternSummary.checkInCount}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
              <Activity size={14} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{patternSummary.averageDistressIntensity || '—'}</Text>
            <Text style={styles.statLabel}>Avg Dist.</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F0E6FF' }]}>
              <BookOpen size={14} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{patternSummary.totalJournalEntries}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={[styles.upgradeBanner, isPremium && styles.upgradeBannerActive]}
            onPress={() => { handleHaptic(); router.push('/upgrade' as never); }}
            activeOpacity={0.7}
            testID="upgrade-btn"
          >
            <View style={styles.upgradeBannerIcon}>
              <Crown size={20} color={isPremium ? '#D4956A' : Colors.white} />
            </View>
            <View style={styles.upgradeBannerContent}>
              <Text style={[styles.upgradeBannerTitle, isPremium && styles.upgradeBannerTitleActive]}>
                {isPremium ? 'Premium Active' : 'Upgrade to Premium'}
              </Text>
              <Text style={[styles.upgradeBannerDesc, isPremium && styles.upgradeBannerDescActive]}>
                {isPremium
                  ? (subState.isTrialActive ? `Trial · ${daysRemaining} days left` : 'All features unlocked')
                  : 'Deeper insights, unlimited AI, therapy reports'}
              </Text>
            </View>
            <ChevronRight size={18} color={isPremium ? '#D4956A' : Colors.white} style={{ opacity: 0.7 }} />
          </TouchableOpacity>
        </Animated.View>

        {personalization.growthSignals.length > 0 && (
          <Animated.View style={[styles.growthSection, { opacity: fadeAnim }]}>
            <View style={styles.growthHeader}>
              <Sparkles size={14} color={Colors.success} />
              <Text style={styles.growthHeaderText}>Growth Signals</Text>
            </View>
            {personalization.growthSignals.slice(0, 2).map((signal, i) => (
              <Text key={i} style={styles.growthText}>{signal}</Text>
            ))}
          </Animated.View>
        )}

        {wins.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={styles.sectionLabel}>RECENT WINS</Text>
            {wins.slice(0, 2).map(win => (
              <View key={win.id} style={styles.winCard}>
                <Compass size={14} color={Colors.success} />
                <Text style={styles.winText}>{win.description}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>INSIGHTS & PROGRESS</Text>
          <View style={styles.navGroup}>
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: Colors.primaryLight }]}>
                <TrendingUp size={16} color={Colors.primary} />
              </View>,
              'My Patterns',
              patternSummary.topTriggerThisMonth ? `Top: ${patternSummary.topTriggerThisMonth}` : 'See your emotional patterns',
              () => router.push('/profile/patterns' as never),
              'patterns-btn',
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: '#E6F0FF' }]}>
                <BarChart3 size={16} color="#3B82F6" />
              </View>,
              'Insights Dashboard',
              'Emotional trends, triggers, and coping',
              () => router.push('/profile/insights-dashboard' as never),
              'insights-dashboard-btn',
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: Colors.accentLight }]}>
                <Award size={16} color={Colors.accent} />
              </View>,
              'Recovery Progress',
              'Track your growth and milestones',
              () => router.push('/profile/progress' as never),
              'progress-btn',
              !isPremium ? premiumBadge : undefined,
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: '#F0E6FF' }]}>
                <FileText size={16} color="#8B5CF6" />
              </View>,
              'Weekly Reflection',
              'Therapy-style summary of your week',
              () => router.push('/weekly-reflection' as never),
              'weekly-reflection-btn',
              !isPremium ? premiumBadge : undefined,
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: Colors.successLight }]}>
                <Calendar size={16} color={Colors.success} />
              </View>,
              'Therapist Report',
              'Structured summaries for therapy',
              () => router.push('/therapy-report' as never),
              'therapy-report-btn',
              !isPremium ? premiumBadge : undefined,
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>RELATIONSHIPS</Text>
          <View style={styles.navGroup}>
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: '#FFE6F0' }]}>
                <Heart size={16} color="#E84393" />
              </View>,
              'Relationship Patterns',
              'Understand your emotional reactions',
              () => router.push('/relationship-insights' as never),
              'relationship-insights-btn',
              !isPremium ? premiumBadge : undefined,
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: '#FDE6E9' }]}>
                <HeartHandshake size={16} color="#D63384" />
              </View>,
              'Relationship Copilot',
              'Guided support during triggers',
              () => router.push('/relationship-copilot' as never),
              'relationship-copilot-btn',
              !isPremium ? premiumBadge : undefined,
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: '#FCE4EC' }]}>
                <Users size={16} color="#C44D8E" />
              </View>,
              'Relationship Profiles',
              'Track patterns with specific people',
              () => router.push('/profile/relationship-profiles' as never),
              'relationship-profiles-btn',
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>ADVANCED INTELLIGENCE</Text>
          <View style={styles.navGroup}>
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: Colors.primaryLight }]}>
                <Brain size={16} color={Colors.primary} />
              </View>,
              'Emotional Profile',
              'Your personal emotional model',
              () => router.push('/emotional-profile' as never),
              'emotional-profile-btn',
              !isPremium ? premiumBadge : undefined,
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: '#E8F5E9' }]}>
                <Sparkles size={16} color={Colors.success} />
              </View>,
              'Reflection Mirror',
              'Compassionate reflections on patterns',
              () => router.push('/reflection-mirror' as never),
              'reflection-mirror-btn',
              !isPremium ? premiumBadge : undefined,
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: Colors.accentLight }]}>
                <Activity size={16} color={Colors.accent} />
              </View>,
              'Emotional Timeline',
              'Replay emotional episodes',
              () => router.push('/emotional-timeline' as never),
              'emotional-timeline-btn',
              !isPremium ? premiumBadge : undefined,
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: '#F0E6FF' }]}>
                <Fingerprint size={16} color="#8B5CF6" />
              </View>,
              'Identity & Values',
              'Build self-trust and a stable sense of self',
              () => router.push('/values-explorer' as never),
              'identity-values-btn',
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: '#E3EDE8' }]}>
                <FileText size={16} color={Colors.primaryDark} />
              </View>,
              'Reflection Report',
              'AI-powered therapy-style summaries',
              () => router.push('/profile/reflection-report' as never),
              'reflection-report-btn',
              !isPremium ? premiumBadge : undefined,
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>SUPPORT PROFILE</Text>
          <View style={styles.navGroup}>
            <TouchableOpacity
              style={styles.profileChipRow}
              onPress={() => { handleHaptic(); router.push('/profile/edit-list?type=triggers' as never); }}
              activeOpacity={0.7}
              testID="edit-triggers-btn"
            >
              <View style={[styles.chipDot, { backgroundColor: '#E17055' }]} />
              <Text style={styles.chipLabel}>Common Triggers</Text>
              <Text style={styles.chipCount}>
                {profile.commonTriggers.length > 0 ? `${profile.commonTriggers.length}` : '—'}
              </Text>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileChipRow}
              onPress={() => { handleHaptic(); router.push('/profile/edit-list?type=urges' as never); }}
              activeOpacity={0.7}
              testID="edit-urges-btn"
            >
              <View style={[styles.chipDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.chipLabel}>Common Urges</Text>
              <Text style={styles.chipCount}>
                {profile.commonUrges.length > 0 ? `${profile.commonUrges.length}` : '—'}
              </Text>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileChipRow}
              onPress={() => { handleHaptic(); router.push('/profile/edit-list?type=coping' as never); }}
              activeOpacity={0.7}
              testID="edit-coping-btn"
            >
              <View style={[styles.chipDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.chipLabel}>What Helps Me</Text>
              <Text style={styles.chipCount}>
                {profile.whatHelpsMe.length > 0 ? `${profile.whatHelpsMe.length}` : '—'}
              </Text>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileChipRow}
              onPress={() => { handleHaptic(); router.push('/profile/edit-list?type=grounding' as never); }}
              activeOpacity={0.7}
              testID="edit-grounding-btn"
            >
              <View style={[styles.chipDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.chipLabel}>Grounding Tools</Text>
              <Text style={styles.chipCount}>
                {profile.preferredGroundingTools.length > 0 ? `${profile.preferredGroundingTools.length}` : '—'}
              </Text>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileChipRow}
              onPress={() => { handleHaptic(); router.push('/profile/edit-list?type=relationship' as never); }}
              activeOpacity={0.7}
              testID="edit-relationship-btn"
            >
              <View style={[styles.chipDot, { backgroundColor: '#E84393' }]} />
              <Text style={styles.chipLabel}>Relationship Triggers</Text>
              <Text style={styles.chipCount}>
                {profile.relationshipTriggers.length > 0 ? `${profile.relationshipTriggers.length}` : '—'}
              </Text>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileChipRow}
              onPress={() => { handleHaptic(); router.push('/profile/edit-list?type=spirals' as never); }}
              activeOpacity={0.7}
              testID="edit-spirals-btn"
            >
              <View style={[styles.chipDot, { backgroundColor: '#D4956A' }]} />
              <Text style={styles.chipLabel}>Emotional Spirals</Text>
              <Text style={styles.chipCount}>
                {(profile.emotionalSpirals?.length ?? 0) > 0 ? `${profile.emotionalSpirals.length}` : '—'}
              </Text>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>MESSAGE SETTINGS</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingCardTop}>
              <Clock size={16} color="#3B82F6" />
              <Text style={styles.settingTitle}>Pause Before Sending</Text>
              <Text style={styles.settingValue}>{profile.messageDelaySeconds < 60 ? `${profile.messageDelaySeconds}s` : `${profile.messageDelaySeconds / 60}m`}</Text>
            </View>
            <View style={styles.delayRow}>
              {[30, 120, 600].map((seconds) => (
                <TouchableOpacity
                  key={seconds}
                  style={[
                    styles.delayChip,
                    profile.messageDelaySeconds === seconds && styles.delayChipActive,
                  ]}
                  onPress={() => { handleHaptic(); updateProfile({ messageDelaySeconds: seconds }); }}
                >
                  <Text
                    style={[
                      styles.delayChipText,
                      profile.messageDelaySeconds === seconds && styles.delayChipTextActive,
                    ]}
                  >
                    {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>EMERGENCY SUPPORT</Text>
          <View style={styles.navGroup}>
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: Colors.dangerLight }]}>
                <Phone size={16} color={Colors.danger} />
              </View>,
              'Crisis Support Preferences',
              profile.crisisSupport.emergencyContact ? 'Contact set up' : 'Set up your safety net',
              () => router.push('/profile/crisis-settings' as never),
              'crisis-settings-btn',
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: '#E6F0FF' }]}>
                <Users size={16} color="#3B82F6" />
              </View>,
              'Trusted Support Contacts',
              (profile.trustedContacts?.length ?? 0) > 0
                ? `${profile.trustedContacts.length} contact${profile.trustedContacts.length !== 1 ? 's' : ''}`
                : 'Add people you trust',
              () => router.push('/profile/trusted-contacts' as never),
              'trusted-contacts-btn',
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.navGroup}>
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: Colors.accentLight }]}>
                <Bell size={16} color={Colors.accent} />
              </View>,
              'Notification Preferences',
              `${(profile.notifications.frequency ?? 'balanced').charAt(0).toUpperCase() + (profile.notifications.frequency ?? 'balanced').slice(1)} · ${profile.notifications.quietHoursEnabled ? 'Quiet hours on' : 'Quiet hours off'}`,
              () => router.push('/profile/notification-preferences' as never),
              'notification-preferences-btn',
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>PRIVACY</Text>
          <View style={styles.toggleGroup}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Lock size={15} color="#8B5CF6" />
                <View>
                  <Text style={styles.toggleTitle}>Anonymous Community</Text>
                  <Text style={styles.toggleDesc}>Default to anonymous when posting</Text>
                </View>
              </View>
              <Switch
                value={profile.privacy.anonymousCommunityPosts}
                onValueChange={(val) => updatePrivacy({ anonymousCommunityPosts: val })}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={profile.privacy.anonymousCommunityPosts ? Colors.primary : Colors.textMuted}
              />
            </View>
            <View style={styles.toggleDivider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Sparkles size={15} color={Colors.primary} />
                <View>
                  <Text style={styles.toggleTitle}>Share with AI Companion</Text>
                  <Text style={styles.toggleDesc}>Let AI reference your patterns</Text>
                </View>
              </View>
              <Switch
                value={profile.privacy.shareInsightsWithCompanion}
                onValueChange={(val) => updatePrivacy({ shareInsightsWithCompanion: val })}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={profile.privacy.shareInsightsWithCompanion ? Colors.primary : Colors.textMuted}
              />
            </View>
            <View style={styles.toggleDivider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Shield size={15} color="#3B82F6" />
                <View>
                  <Text style={styles.toggleTitle}>Biometric Lock</Text>
                  <Text style={styles.toggleDesc}>Require Face ID / fingerprint</Text>
                </View>
              </View>
              <Switch
                value={profile.privacy.lockAppWithBiometrics}
                onValueChange={(val) => updatePrivacy({ lockAppWithBiometrics: val })}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={profile.privacy.lockAppWithBiometrics ? Colors.primary : Colors.textMuted}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>DEVELOPER</Text>
          <View style={styles.navGroup}>
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: '#E6F0FF' }]}>
                <Bug size={16} color="#3B82F6" />
              </View>,
              'Analytics Debug',
              'View tracked events and flow metrics',
              () => router.push('/profile/analytics-debug' as never),
              'analytics-debug-btn',
            )}
            {renderNavRow(
              <View style={[styles.navIcon, { backgroundColor: '#FFF5EB' }]}>
                <Bell size={16} color={Colors.accent} />
              </View>,
              'Notification Debug',
              'Scheduled reminders, logs, test triggers',
              () => router.push('/profile/notification-debug' as never),
              'notification-debug-btn',
            )}
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BPD Companion</Text>
          <Text style={styles.footerVersion}>You're doing something brave by being here.</Text>
        </View>

        <View style={styles.bottomSpacer} />
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
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
    paddingTop: 12,
  },
  headerTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  premiumAvatarBadge: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF5EB',
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  upgradeBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  upgradeBannerActive: {
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#F5E0CC',
  },
  upgradeBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  upgradeBannerContent: {
    flex: 1,
  },
  upgradeBannerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 2,
  },
  upgradeBannerTitleActive: {
    color: Colors.text,
  },
  upgradeBannerDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  upgradeBannerDescActive: {
    color: Colors.textSecondary,
  },
  growthSection: {
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  growthHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 10,
  },
  growthHeaderText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  growthText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
    marginBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 2,
  },
  navGroup: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden' as const,
  },
  navRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  navRowText: {
    flex: 1,
  },
  navRowTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  navRowTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  navRowDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  premiumBadge: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#FFF0E3',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  profileChipRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  chipLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  chipCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginRight: 8,
  },
  settingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  settingCardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 14,
  },
  settingTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  delayRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  delayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
  },
  delayChipActive: {
    backgroundColor: Colors.primary,
  },
  delayChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  delayChipTextActive: {
    color: Colors.white,
  },
  toggleGroup: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden' as const,
  },
  toggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 14,
  },
  toggleLeft: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  toggleDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  toggleDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 14,
  },
  winCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  winText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginTop: 1,
  },
  footer: {
    alignItems: 'center' as const,
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
  bottomSpacer: {
    height: 30,
  },
});
