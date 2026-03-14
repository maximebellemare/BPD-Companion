import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Bell,
  BellOff,
  Moon,
  Sun,
  Clock,
  Calendar,
  Heart,
  Thermometer,
  Flame,
  Sparkles,
  FileText,
  MessageCircle,
  RefreshCw,
  Zap,
  Shield,
  ChevronDown,
  Volume2,
  Crown,
  Gift,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useProfile } from '@/providers/ProfileProvider';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

const QUIET_START_OPTIONS = ['20:00', '21:00', '22:00', '23:00', '00:00'];
const QUIET_END_OPTIONS = ['05:00', '06:00', '07:00', '08:00', '09:00'];

type FrequencyLevel = 'minimal' | 'balanced' | 'supportive';

export default function NotificationPreferencesScreen() {
  const { profile, updateNotifications } = useProfile();
  const n = profile.notifications;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [expandedTimePicker, setExpandedTimePicker] = useState<string | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const toggleTimePicker = useCallback((key: string) => {
    handleHaptic();
    setExpandedTimePicker(prev => prev === key ? null : key);
  }, [handleHaptic]);

  const renderToggle = useCallback((
    icon: React.ReactNode,
    title: string,
    desc: string,
    value: boolean,
    onToggle: (val: boolean) => void,
    testId?: string,
  ) => (
    <View style={styles.toggleRow} testID={testId}>
      <View style={styles.toggleLeft}>
        {icon}
        <View style={styles.toggleTextBlock}>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.toggleDesc}>{desc}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={(val) => { handleHaptic(); onToggle(val); }}
        trackColor={{ false: Colors.border, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.textMuted}
      />
    </View>
  ), [handleHaptic]);

  const renderTimePicker = useCallback((
    key: string,
    currentValue: string,
    options: string[],
    onSelect: (val: string) => void,
  ) => {
    const isExpanded = expandedTimePicker === key;
    return (
      <View>
        <TouchableOpacity
          style={styles.timePickerButton}
          onPress={() => toggleTimePicker(key)}
          activeOpacity={0.7}
        >
          <Clock size={14} color={Colors.textSecondary} />
          <Text style={styles.timePickerValue}>{currentValue}</Text>
          <ChevronDown
            size={14}
            color={Colors.textMuted}
            style={isExpanded ? { transform: [{ rotate: '180deg' }] } : undefined}
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.timeOptions}>
            {options.map(time => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeOption,
                  currentValue === time && styles.timeOptionActive,
                ]}
                onPress={() => {
                  handleHaptic();
                  onSelect(time);
                  setExpandedTimePicker(null);
                }}
              >
                <Text style={[
                  styles.timeOptionText,
                  currentValue === time && styles.timeOptionTextActive,
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }, [expandedTimePicker, toggleTimePicker, handleHaptic]);

  const renderWeekdayPicker = useCallback((
    currentDay: number,
    onSelect: (day: number) => void,
  ) => (
    <View style={styles.weekdayRow}>
      {WEEKDAYS.map((day, i) => (
        <TouchableOpacity
          key={day}
          style={[
            styles.weekdayChip,
            currentDay === i && styles.weekdayChipActive,
          ]}
          onPress={() => { handleHaptic(); onSelect(i); }}
        >
          <Text style={[
            styles.weekdayChipText,
            currentDay === i && styles.weekdayChipTextActive,
          ]}>
            {day.slice(0, 3)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  ), [handleHaptic]);

  const frequencyLevel = (n.frequency ?? 'balanced') as FrequencyLevel;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notification Preferences', headerTintColor: Colors.text }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.headerCard}>
            <View style={styles.headerIconRow}>
              <View style={styles.headerIcon}>
                <Bell size={20} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.headerTitle}>Notification Preferences</Text>
            <Text style={styles.headerSubtitle}>
              Choose what reminders feel right for you. These are designed to support — never pressure.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>REMINDER FREQUENCY</Text>
            <View style={styles.frequencyRow}>
              {(['minimal', 'balanced', 'supportive'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.frequencyChip,
                    frequencyLevel === level && styles.frequencyChipActive,
                  ]}
                  onPress={() => { handleHaptic(); updateNotifications({ frequency: level }); }}
                  testID={`frequency-${level}`}
                >
                  {level === 'minimal' && <BellOff size={14} color={frequencyLevel === level ? Colors.white : Colors.textSecondary} />}
                  {level === 'balanced' && <Bell size={14} color={frequencyLevel === level ? Colors.white : Colors.textSecondary} />}
                  {level === 'supportive' && <Volume2 size={14} color={frequencyLevel === level ? Colors.white : Colors.textSecondary} />}
                  <Text style={[
                    styles.frequencyText,
                    frequencyLevel === level && styles.frequencyTextActive,
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.frequencyHint}>
              {frequencyLevel === 'minimal' && 'Only essential reminders like daily check-in and weekly reflection.'}
              {frequencyLevel === 'balanced' && 'Core reminders plus gentle contextual support.'}
              {frequencyLevel === 'supportive' && 'All available reminders including streak and re-engagement nudges.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DAILY REMINDERS</Text>
            <View style={styles.card}>
              {renderToggle(
                <Sun size={16} color="#F59E0B" />,
                'Daily Check-in',
                'A gentle reminder to check in with yourself',
                n.dailyCheckInReminder,
                (val) => updateNotifications({ dailyCheckInReminder: val }),
                'toggle-daily-checkin',
              )}
              {n.dailyCheckInReminder && (
                <View style={styles.subSetting}>
                  <Text style={styles.subSettingLabel}>Reminder time</Text>
                  {renderTimePicker(
                    'checkin_time',
                    n.checkInReminderTime,
                    TIME_OPTIONS,
                    (val) => updateNotifications({ checkInReminderTime: val }),
                  )}
                </View>
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Flame size={16} color={Colors.accent} />,
                'Morning Ritual',
                'Start your day with emotional awareness',
                n.ritualReminders ?? true,
                (val) => updateNotifications({ ritualReminders: val }),
                'toggle-ritual',
              )}
              {(n.ritualReminders ?? true) && (
                <View style={styles.subSetting}>
                  <Text style={styles.subSettingLabel}>Morning time</Text>
                  {renderTimePicker(
                    'morning_time',
                    n.morningRitualTime ?? '08:00',
                    TIME_OPTIONS.filter(t => parseInt(t) <= 12),
                    (val) => updateNotifications({ morningRitualTime: val }),
                  )}
                  <Text style={[styles.subSettingLabel, { marginTop: 8 }]}>Evening time</Text>
                  {renderTimePicker(
                    'evening_time',
                    n.eveningRitualTime ?? '20:00',
                    TIME_OPTIONS.filter(t => parseInt(t) >= 17),
                    (val) => updateNotifications({ eveningRitualTime: val }),
                  )}
                </View>
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Zap size={16} color="#8B5CF6" />,
                'Streak Support',
                'Encouragement to keep your check-in rhythm',
                n.streakSupport ?? true,
                (val) => updateNotifications({ streakSupport: val }),
                'toggle-streak',
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WEEKLY REMINDERS</Text>
            <View style={styles.card}>
              {renderToggle(
                <RefreshCw size={16} color={Colors.primary} />,
                'Weekly Reflection',
                'When your weekly reflection summary is ready',
                n.weeklyReflectionReminder,
                (val) => updateNotifications({ weeklyReflectionReminder: val }),
                'toggle-weekly-reflection',
              )}
              {n.weeklyReflectionReminder && (
                <View style={styles.subSetting}>
                  <Text style={styles.subSettingLabel}>Preferred day</Text>
                  {renderWeekdayPicker(
                    n.weeklyReflectionDay ?? 1,
                    (day) => updateNotifications({ weeklyReflectionDay: day }),
                  )}
                  <Text style={[styles.subSettingLabel, { marginTop: 8 }]}>Preferred time</Text>
                  {renderTimePicker(
                    'weekly_time',
                    n.weeklyReflectionTime ?? '10:00',
                    TIME_OPTIONS,
                    (val) => updateNotifications({ weeklyReflectionTime: val }),
                  )}
                </View>
              )}
              <View style={styles.divider} />

              {renderToggle(
                <FileText size={16} color={Colors.success} />,
                'Therapist Report',
                'When a new therapy report is generated',
                n.therapistReportReminder ?? true,
                (val) => updateNotifications({ therapistReportReminder: val }),
                'toggle-therapist',
              )}

              <View style={styles.divider} />

              {renderToggle(
                <Calendar size={16} color="#3B82F6" />,
                'Weekend Reminders',
                'Receive reminders on weekends too',
                n.weekendReminders ?? true,
                (val) => updateNotifications({ weekendReminders: val }),
                'toggle-weekends',
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONTEXTUAL SUPPORT</Text>
            <View style={styles.card}>
              {renderToggle(
                <MessageCircle size={16} color="#E84393" />,
                'Relationship Support',
                'Gentle pause reminders during relationship triggers',
                n.relationshipSupportReminders,
                (val) => updateNotifications({ relationshipSupportReminders: val }),
                'toggle-relationship',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Thermometer size={16} color={Colors.danger} />,
                'Regulation Follow-ups',
                'Check-in after high distress episodes',
                n.regulationFollowUps,
                (val) => updateNotifications({ regulationFollowUps: val }),
                'toggle-regulation',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Heart size={16} color={Colors.primary} />,
                'Calm Follow-ups',
                'A gentle check-in after intense moments settle',
                n.calmFollowups ?? true,
                (val) => updateNotifications({ calmFollowups: val }),
                'toggle-calm',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Bell size={16} color={Colors.accent} />,
                'Gentle Nudges',
                'Supportive end-of-day reminders',
                n.gentleNudges,
                (val) => updateNotifications({ gentleNudges: val }),
                'toggle-nudges',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <RefreshCw size={16} color="#6366F1" />,
                'Re-engagement',
                'Supportive nudge if you haven\'t visited in a while',
                n.reengagementReminders ?? true,
                (val) => updateNotifications({ reengagementReminders: val }),
                'toggle-reengagement',
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PREMIUM</Text>
            <View style={styles.card}>
              {renderToggle(
                <Sparkles size={16} color="#D4956A" />,
                'Premium Insights',
                'Deeper emotional pattern notifications',
                n.premiumReflections ?? true,
                (val) => updateNotifications({ premiumReflections: val }),
                'toggle-premium',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Crown size={16} color="#D4956A" />,
                'Premium Feature Reminders',
                'Occasional reminders about advanced features you\'ve explored',
                n.premiumInsightReminders ?? true,
                (val) => updateNotifications({ premiumInsightReminders: val }),
                'toggle-premium-insights',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Gift size={16} color="#D4956A" />,
                'Upgrade Reminders',
                'Respectful reminders about premium benefits',
                n.upgradeReminders ?? true,
                (val) => updateNotifications({ upgradeReminders: val }),
                'toggle-upgrade-reminders',
              )}
            </View>
            <Text style={styles.premiumNote}>
              Premium reminders are never sent during high distress or crisis moments.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SMART BEHAVIOR NOTIFICATIONS</Text>
            <View style={styles.card}>
              {renderToggle(
                <Heart size={16} color="#10B981" />,
                'Gentle Check-ins',
                'Supportive nudge if you haven\'t visited in a while',
                n.behaviorCheckIns ?? true,
                (val) => updateNotifications({ behaviorCheckIns: val }),
                'toggle-behavior-checkins',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Shield size={16} color={Colors.danger} />,
                'Distress Support',
                'Support nudges when emotional patterns are intense',
                n.behaviorDistressSupport ?? true,
                (val) => updateNotifications({ behaviorDistressSupport: val }),
                'toggle-behavior-distress',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <FileText size={16} color="#6366F1" />,
                'Reflection Prompts',
                'Journal prompts after intense message sessions',
                n.behaviorJournalPrompts ?? true,
                (val) => updateNotifications({ behaviorJournalPrompts: val }),
                'toggle-behavior-journal',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Sparkles size={16} color="#F59E0B" />,
                'Progress Celebrations',
                'Celebrate streaks, insights, and emotional growth',
                n.behaviorProgressCelebrations ?? true,
                (val) => updateNotifications({ behaviorProgressCelebrations: val }),
                'toggle-behavior-progress',
              )}
            </View>
            <Text style={styles.premiumNote}>
              These notifications adapt to your behavior and emotional patterns. They are always respectful of your current emotional state.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>QUIET HOURS</Text>
            <View style={styles.card}>
              {renderToggle(
                <Moon size={16} color="#6366F1" />,
                'Enable Quiet Hours',
                'No notifications during this time window',
                n.quietHoursEnabled ?? false,
                (val) => updateNotifications({ quietHoursEnabled: val }),
                'toggle-quiet-hours',
              )}
              {(n.quietHoursEnabled ?? false) && (
                <View style={styles.quietHoursConfig}>
                  <View style={styles.quietHoursRow}>
                    <View style={styles.quietHoursCol}>
                      <Text style={styles.quietHoursLabel}>Start</Text>
                      {renderTimePicker(
                        'quiet_start',
                        n.quietHoursStart ?? '22:00',
                        QUIET_START_OPTIONS,
                        (val) => updateNotifications({ quietHoursStart: val }),
                      )}
                    </View>
                    <View style={styles.quietHoursDash}>
                      <Text style={styles.quietHoursDashText}>to</Text>
                    </View>
                    <View style={styles.quietHoursCol}>
                      <Text style={styles.quietHoursLabel}>End</Text>
                      {renderTimePicker(
                        'quiet_end',
                        n.quietHoursEnd ?? '07:00',
                        QUIET_END_OPTIONS,
                        (val) => updateNotifications({ quietHoursEnd: val }),
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={styles.safetyNote}>
            <Shield size={14} color={Colors.primary} />
            <Text style={styles.safetyNoteText}>
              We never send guilt-based reminders, pressure-heavy phrases, or upgrade prompts during high distress. Your emotional safety comes first.
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </Animated.View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center' as const,
  },
  headerIconRow: {
    marginBottom: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 19,
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
  card: {
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
  toggleTextBlock: {
    flex: 1,
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
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 14,
  },
  subSetting: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 2,
    marginLeft: 28,
  },
  subSettingLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  timePickerButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start' as const,
  },
  timePickerValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  timeOptions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 8,
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  timeOptionActive: {
    backgroundColor: Colors.primary,
  },
  timeOptionText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  timeOptionTextActive: {
    color: Colors.white,
  },
  weekdayRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  weekdayChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  weekdayChipActive: {
    backgroundColor: Colors.primary,
  },
  weekdayChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  weekdayChipTextActive: {
    color: Colors.white,
  },
  frequencyRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 10,
  },
  frequencyChip: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  frequencyChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  frequencyTextActive: {
    color: Colors.white,
  },
  frequencyHint: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    marginLeft: 2,
  },
  quietHoursConfig: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  quietHoursRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
  },
  quietHoursCol: {
    flex: 1,
  },
  quietHoursLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  quietHoursDash: {
    paddingTop: 28,
  },
  quietHoursDashText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  safetyNote: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
  },
  safetyNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  premiumNote: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 30,
  },
});
