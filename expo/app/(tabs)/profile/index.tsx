import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Switch,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  User,
  Heart,
  Zap,
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
  AlertTriangle,
  Phone,
  BarChart3,
  Users,
  RefreshCw,
  Award,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useProfile } from '@/providers/ProfileProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, patternSummary, updateProfile, updateNotifications, updatePrivacy } = useProfile();

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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={28} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.headerTitle}>Your Profile</Text>
          <Text style={styles.headerSubtitle}>
            {daysSinceJoined} day{daysSinceJoined !== 1 ? 's' : ''} of showing up for yourself
          </Text>
        </Animated.View>

        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primaryLight }]}>
              <Flame size={16} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{patternSummary.journalStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.accentLight }]}>
              <Target size={16} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>{patternSummary.checkInCount}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
              <Activity size={16} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{patternSummary.averageDistressIntensity || '—'}</Text>
            <Text style={styles.statLabel}>Avg Intensity</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.patternsBanner}
            onPress={() => {
              handleHaptic();
              router.push('/profile/patterns' as never);
            }}
            activeOpacity={0.7}
            testID="patterns-btn"
          >
            <View style={styles.patternsBannerLeft}>
              <View style={styles.patternsBannerIcon}>
                <TrendingUp size={20} color={Colors.white} />
              </View>
              <View style={styles.patternsBannerContent}>
                <Text style={styles.patternsBannerTitle}>My Patterns</Text>
                <Text style={styles.patternsBannerDesc}>
                  {patternSummary.topTriggerThisMonth
                    ? `Top trigger: ${patternSummary.topTriggerThisMonth}`
                    : 'Start checking in to see your patterns'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.white} style={{ opacity: 0.7 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.insightsBanner}
            onPress={() => {
              handleHaptic();
              router.push('/insights' as never);
            }}
            activeOpacity={0.7}
            testID="insights-btn"
          >
            <View style={styles.patternsBannerLeft}>
              <View style={[styles.patternsBannerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <BarChart3 size={20} color={Colors.white} />
              </View>
              <View style={styles.patternsBannerContent}>
                <Text style={styles.patternsBannerTitle}>Insights</Text>
                <Text style={styles.patternsBannerDesc}>Charts, trends, and emotional patterns</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.white} style={{ opacity: 0.7 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.progressBanner}
            onPress={() => {
              handleHaptic();
              router.push('/profile/progress' as never);
            }}
            activeOpacity={0.7}
            testID="progress-btn"
          >
            <View style={styles.patternsBannerLeft}>
              <View style={[styles.patternsBannerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Award size={20} color={Colors.white} />
              </View>
              <View style={styles.patternsBannerContent}>
                <Text style={styles.patternsBannerTitle}>Recovery Progress</Text>
                <Text style={styles.patternsBannerDesc}>Track your growth and milestones</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.white} style={{ opacity: 0.7 }} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Support Profile</Text>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => {
              handleHaptic();
              router.push('/profile/edit-list?type=triggers' as never);
            }}
            activeOpacity={0.7}
            testID="edit-triggers-btn"
          >
            <View style={[styles.settingCardIcon, { backgroundColor: '#FFF0E6' }]}>
              <Zap size={18} color="#E17055" />
            </View>
            <View style={styles.settingCardContent}>
              <Text style={styles.settingCardTitle}>My Common Triggers</Text>
              <Text style={styles.settingCardValue}>
                {profile.commonTriggers.length > 0
                  ? `${profile.commonTriggers.length} selected`
                  : 'Tap to set up'}
              </Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => {
              handleHaptic();
              router.push('/profile/edit-list?type=urges' as never);
            }}
            activeOpacity={0.7}
            testID="edit-urges-btn"
          >
            <View style={[styles.settingCardIcon, { backgroundColor: '#F0E6FF' }]}>
              <AlertTriangle size={18} color="#8B5CF6" />
            </View>
            <View style={styles.settingCardContent}>
              <Text style={styles.settingCardTitle}>My Common Urges</Text>
              <Text style={styles.settingCardValue}>
                {profile.commonUrges.length > 0
                  ? `${profile.commonUrges.length} selected`
                  : 'Tap to set up'}
              </Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => {
              handleHaptic();
              router.push('/profile/edit-list?type=coping' as never);
            }}
            activeOpacity={0.7}
            testID="edit-coping-btn"
          >
            <View style={[styles.settingCardIcon, { backgroundColor: Colors.primaryLight }]}>
              <Heart size={18} color={Colors.primary} />
            </View>
            <View style={styles.settingCardContent}>
              <Text style={styles.settingCardTitle}>What Usually Helps Me</Text>
              <Text style={styles.settingCardValue}>
                {profile.whatHelpsMe.length > 0
                  ? `${profile.whatHelpsMe.length} selected`
                  : 'Tap to set up'}
              </Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => {
              handleHaptic();
              router.push('/profile/edit-list?type=grounding' as never);
            }}
            activeOpacity={0.7}
            testID="edit-grounding-btn"
          >
            <View style={[styles.settingCardIcon, { backgroundColor: Colors.successLight }]}>
              <Sparkles size={18} color={Colors.success} />
            </View>
            <View style={styles.settingCardContent}>
              <Text style={styles.settingCardTitle}>Preferred Grounding Tools</Text>
              <Text style={styles.settingCardValue}>
                {profile.preferredGroundingTools.length > 0
                  ? `${profile.preferredGroundingTools.length} selected`
                  : 'Tap to set up'}
              </Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => {
              handleHaptic();
              router.push('/profile/edit-list?type=relationship' as never);
            }}
            activeOpacity={0.7}
            testID="edit-relationship-btn"
          >
            <View style={[styles.settingCardIcon, { backgroundColor: '#FFE6F0' }]}>
              <Heart size={18} color="#E84393" />
            </View>
            <View style={styles.settingCardContent}>
              <Text style={styles.settingCardTitle}>Relationship Triggers</Text>
              <Text style={styles.settingCardValue}>
                {profile.relationshipTriggers.length > 0
                  ? `${profile.relationshipTriggers.length} selected`
                  : 'Tap to set up'}
              </Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => {
              handleHaptic();
              router.push('/profile/edit-list?type=spirals' as never);
            }}
            activeOpacity={0.7}
            testID="edit-spirals-btn"
          >
            <View style={[styles.settingCardIcon, { backgroundColor: '#FFF0E6' }]}>
              <RefreshCw size={18} color="#D4956A" />
            </View>
            <View style={styles.settingCardContent}>
              <Text style={styles.settingCardTitle}>My Emotional Spirals</Text>
              <Text style={styles.settingCardValue}>
                {(profile.emotionalSpirals?.length ?? 0) > 0
                  ? `${profile.emotionalSpirals.length} identified`
                  : 'Recognize your patterns'}
              </Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Message Settings</Text>
          <View style={styles.settingCard}>
            <View style={[styles.settingCardIcon, { backgroundColor: '#E6F0FF' }]}>
              <Clock size={18} color="#3B82F6" />
            </View>
            <View style={styles.settingCardContent}>
              <Text style={styles.settingCardTitle}>Pause Before Sending</Text>
              <Text style={styles.settingCardValue}>{profile.messageDelaySeconds}s default delay</Text>
            </View>
            <View style={styles.delayButtons}>
              {[30, 120, 600].map((seconds) => (
                <TouchableOpacity
                  key={seconds}
                  style={[
                    styles.delayChip,
                    profile.messageDelaySeconds === seconds && styles.delayChipActive,
                  ]}
                  onPress={() => {
                    handleHaptic();
                    updateProfile({ messageDelaySeconds: seconds });
                  }}
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
          <Text style={styles.sectionTitle}>Emergency Support</Text>
          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => {
              handleHaptic();
              router.push('/profile/crisis-settings' as never);
            }}
            activeOpacity={0.7}
            testID="crisis-settings-btn"
          >
            <View style={[styles.settingCardIcon, { backgroundColor: Colors.dangerLight }]}>
              <Phone size={18} color={Colors.danger} />
            </View>
            <View style={styles.settingCardContent}>
              <Text style={styles.settingCardTitle}>Crisis Support Preferences</Text>
              <Text style={styles.settingCardValue}>
                {profile.crisisSupport.emergencyContact
                  ? 'Contact set up'
                  : 'Set up your safety net'}
              </Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => {
              handleHaptic();
              router.push('/profile/trusted-contacts' as never);
            }}
            activeOpacity={0.7}
            testID="trusted-contacts-btn"
          >
            <View style={[styles.settingCardIcon, { backgroundColor: '#E6F0FF' }]}>
              <Users size={18} color="#3B82F6" />
            </View>
            <View style={styles.settingCardContent}>
              <Text style={styles.settingCardTitle}>Trusted Support Contacts</Text>
              <Text style={styles.settingCardValue}>
                {(profile.trustedContacts?.length ?? 0) > 0
                  ? `${profile.trustedContacts.length} contact${profile.trustedContacts.length !== 1 ? 's' : ''}`
                  : 'Add people you trust'}
              </Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.toggleCard}>
            <View style={styles.toggleCardContent}>
              <View style={[styles.settingCardIcon, { backgroundColor: Colors.accentLight }]}>
                <Bell size={18} color={Colors.accent} />
              </View>
              <View style={styles.toggleCardText}>
                <Text style={styles.settingCardTitle}>Daily Check-in Reminder</Text>
                <Text style={styles.toggleCardDesc}>A gentle nudge to check in with yourself</Text>
              </View>
            </View>
            <Switch
              value={profile.notifications.dailyCheckInReminder}
              onValueChange={(val) => updateNotifications({ dailyCheckInReminder: val })}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={profile.notifications.dailyCheckInReminder ? Colors.primary : Colors.textMuted}
            />
          </View>
          <View style={styles.toggleCard}>
            <View style={styles.toggleCardContent}>
              <View style={[styles.settingCardIcon, { backgroundColor: Colors.primaryLight }]}>
                <Heart size={18} color={Colors.primary} />
              </View>
              <View style={styles.toggleCardText}>
                <Text style={styles.settingCardTitle}>Gentle Nudges</Text>
                <Text style={styles.toggleCardDesc}>Supportive reminders throughout the day</Text>
              </View>
            </View>
            <Switch
              value={profile.notifications.gentleNudges}
              onValueChange={(val) => updateNotifications({ gentleNudges: val })}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={profile.notifications.gentleNudges ? Colors.primary : Colors.textMuted}
            />
          </View>
          <View style={styles.toggleCard}>
            <View style={styles.toggleCardContent}>
              <View style={[styles.settingCardIcon, { backgroundColor: Colors.successLight }]}>
                <TrendingUp size={18} color={Colors.success} />
              </View>
              <View style={styles.toggleCardText}>
                <Text style={styles.settingCardTitle}>Weekly Insights</Text>
                <Text style={styles.toggleCardDesc}>Summary of your emotional patterns</Text>
              </View>
            </View>
            <Switch
              value={profile.notifications.weeklyInsights}
              onValueChange={(val) => updateNotifications({ weeklyInsights: val })}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={profile.notifications.weeklyInsights ? Colors.primary : Colors.textMuted}
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.toggleCard}>
            <View style={styles.toggleCardContent}>
              <View style={[styles.settingCardIcon, { backgroundColor: '#F0E6FF' }]}>
                <Lock size={18} color="#8B5CF6" />
              </View>
              <View style={styles.toggleCardText}>
                <Text style={styles.settingCardTitle}>Anonymous Community Posts</Text>
                <Text style={styles.toggleCardDesc}>Default to anonymous when posting</Text>
              </View>
            </View>
            <Switch
              value={profile.privacy.anonymousCommunityPosts}
              onValueChange={(val) => updatePrivacy({ anonymousCommunityPosts: val })}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={profile.privacy.anonymousCommunityPosts ? Colors.primary : Colors.textMuted}
            />
          </View>
          <View style={styles.toggleCard}>
            <View style={styles.toggleCardContent}>
              <View style={[styles.settingCardIcon, { backgroundColor: Colors.primaryLight }]}>
                <Sparkles size={18} color={Colors.primary} />
              </View>
              <View style={styles.toggleCardText}>
                <Text style={styles.settingCardTitle}>Share Insights with Companion</Text>
                <Text style={styles.toggleCardDesc}>Let AI reference your patterns</Text>
              </View>
            </View>
            <Switch
              value={profile.privacy.shareInsightsWithCompanion}
              onValueChange={(val) => updatePrivacy({ shareInsightsWithCompanion: val })}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={profile.privacy.shareInsightsWithCompanion ? Colors.primary : Colors.textMuted}
            />
          </View>
          <View style={styles.toggleCard}>
            <View style={styles.toggleCardContent}>
              <View style={[styles.settingCardIcon, { backgroundColor: '#E6F0FF' }]}>
                <Shield size={18} color="#3B82F6" />
              </View>
              <View style={styles.toggleCardText}>
                <Text style={styles.settingCardTitle}>Biometric Lock</Text>
                <Text style={styles.toggleCardDesc}>Require Face ID / fingerprint</Text>
              </View>
            </View>
            <Switch
              value={profile.privacy.lockAppWithBiometrics}
              onValueChange={(val) => updatePrivacy({ lockAppWithBiometrics: val })}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={profile.privacy.lockAppWithBiometrics ? Colors.primary : Colors.textMuted}
            />
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
    alignItems: 'center' as const,
    marginBottom: 24,
    paddingTop: 12,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  patternsBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 18,
  },
  patternsBannerLeft: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  patternsBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  patternsBannerContent: {
    flex: 1,
  },
  patternsBannerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 3,
  },
  patternsBannerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  settingCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  settingCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  settingCardContent: {
    flex: 1,
  },
  settingCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  settingCardValue: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  delayButtons: {
    flexDirection: 'row' as const,
    gap: 6,
  },
  delayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  delayChipActive: {
    backgroundColor: Colors.primary,
  },
  delayChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  delayChipTextActive: {
    color: Colors.white,
  },
  toggleCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  toggleCardContent: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  toggleCardText: {
    flex: 1,
  },
  toggleCardDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
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
  insightsBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#507A66',
    padding: 18,
    borderRadius: 18,
    marginTop: 10,
  },
  progressBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#D4956A',
    padding: 18,
    borderRadius: 18,
    marginTop: 10,
  },
});
