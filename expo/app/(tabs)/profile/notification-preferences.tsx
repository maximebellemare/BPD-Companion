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
import { useTranslation } from 'react-i18next';
import Colors from '@/constants/colors';
import { useProfile } from '@/providers/ProfileProvider';

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

const QUIET_START_OPTIONS = ['20:00', '21:00', '22:00', '23:00', '00:00'];
const QUIET_END_OPTIONS = ['05:00', '06:00', '07:00', '08:00', '09:00'];

type FrequencyLevel = 'minimal' | 'balanced' | 'supportive';

export default function NotificationPreferencesScreen() {
  const { t } = useTranslation('profile');
  const { profile, updateNotifications } = useProfile();
  const n = profile.notifications;
  const weekdays = t('notificationPreferences.weekdaysShort', { returnObjects: true }) as string[];

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
      {weekdays.map((day, i) => (
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
            {day}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  ), [handleHaptic, weekdays]);

  const frequencyLevel = (n.frequency ?? 'balanced') as FrequencyLevel;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('notificationPreferences.title'), headerTintColor: Colors.text }} />
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
            <Text style={styles.headerTitle}>{t('notificationPreferences.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('notificationPreferences.subtitle')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('notificationPreferences.sections.frequency')}</Text>
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
                    {t(`notifications.frequencies.${level}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.frequencyHint}>
              {t(`notificationPreferences.frequencyHints.${frequencyLevel}`)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('notificationPreferences.sections.daily')}</Text>
            <View style={styles.card}>
              {renderToggle(
                <Sun size={16} color="#67E8F9" />,
                t('notificationPreferences.toggles.dailyCheckIn.0'),
                t('notificationPreferences.toggles.dailyCheckIn.1'),
                n.dailyCheckInReminder,
                (val) => updateNotifications({ dailyCheckInReminder: val }),
                'toggle-daily-checkin',
              )}
              {n.dailyCheckInReminder && (
                <View style={styles.subSetting}>
                  <Text style={styles.subSettingLabel}>{t('notificationPreferences.labels.reminderTime')}</Text>
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
                t('notificationPreferences.toggles.morningRitual.0'),
                t('notificationPreferences.toggles.morningRitual.1'),
                n.ritualReminders ?? true,
                (val) => updateNotifications({ ritualReminders: val }),
                'toggle-ritual',
              )}
              {(n.ritualReminders ?? true) && (
                <View style={styles.subSetting}>
                  <Text style={styles.subSettingLabel}>{t('notificationPreferences.labels.morningTime')}</Text>
                  {renderTimePicker(
                    'morning_time',
                    n.morningRitualTime ?? '08:00',
                    TIME_OPTIONS.filter(t => parseInt(t) <= 12),
                    (val) => updateNotifications({ morningRitualTime: val }),
                  )}
                  <Text style={[styles.subSettingLabel, { marginTop: 8 }]}>{t('notificationPreferences.labels.eveningTime')}</Text>
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
                <Zap size={16} color="#3B82F6" />,
                t('notificationPreferences.toggles.streakSupport.0'),
                t('notificationPreferences.toggles.streakSupport.1'),
                n.streakSupport ?? true,
                (val) => updateNotifications({ streakSupport: val }),
                'toggle-streak',
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('notificationPreferences.sections.weekly')}</Text>
            <View style={styles.card}>
              {renderToggle(
                <RefreshCw size={16} color={Colors.primary} />,
                t('notificationPreferences.toggles.weeklyReflection.0'),
                t('notificationPreferences.toggles.weeklyReflection.1'),
                n.weeklyReflectionReminder,
                (val) => updateNotifications({ weeklyReflectionReminder: val }),
                'toggle-weekly-reflection',
              )}
              {n.weeklyReflectionReminder && (
                <View style={styles.subSetting}>
                  <Text style={styles.subSettingLabel}>{t('notificationPreferences.labels.preferredDay')}</Text>
                  {renderWeekdayPicker(
                    n.weeklyReflectionDay ?? 1,
                    (day) => updateNotifications({ weeklyReflectionDay: day }),
                  )}
                  <Text style={[styles.subSettingLabel, { marginTop: 8 }]}>{t('notificationPreferences.labels.preferredTime')}</Text>
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
                t('notificationPreferences.toggles.therapistReport.0'),
                t('notificationPreferences.toggles.therapistReport.1'),
                n.therapistReportReminder ?? true,
                (val) => updateNotifications({ therapistReportReminder: val }),
                'toggle-therapist',
              )}

              <View style={styles.divider} />

              {renderToggle(
                <Calendar size={16} color="#3B82F6" />,
                t('notificationPreferences.toggles.weekendReminders.0'),
                t('notificationPreferences.toggles.weekendReminders.1'),
                n.weekendReminders ?? true,
                (val) => updateNotifications({ weekendReminders: val }),
                'toggle-weekends',
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('notificationPreferences.sections.contextual')}</Text>
            <View style={styles.card}>
              {renderToggle(
                <MessageCircle size={16} color="#3B82F6" />,
                t('notificationPreferences.toggles.relationshipSupport.0'),
                t('notificationPreferences.toggles.relationshipSupport.1'),
                n.relationshipSupportReminders,
                (val) => updateNotifications({ relationshipSupportReminders: val }),
                'toggle-relationship',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Thermometer size={16} color={Colors.danger} />,
                t('notificationPreferences.toggles.regulationFollowUps.0'),
                t('notificationPreferences.toggles.regulationFollowUps.1'),
                n.regulationFollowUps,
                (val) => updateNotifications({ regulationFollowUps: val }),
                'toggle-regulation',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Heart size={16} color={Colors.primary} />,
                t('notificationPreferences.toggles.calmFollowups.0'),
                t('notificationPreferences.toggles.calmFollowups.1'),
                n.calmFollowups ?? true,
                (val) => updateNotifications({ calmFollowups: val }),
                'toggle-calm',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Bell size={16} color={Colors.accent} />,
                t('notificationPreferences.toggles.gentleNudges.0'),
                t('notificationPreferences.toggles.gentleNudges.1'),
                n.gentleNudges,
                (val) => updateNotifications({ gentleNudges: val }),
                'toggle-nudges',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <RefreshCw size={16} color="#3B82F6" />,
                t('notificationPreferences.toggles.reengagement.0'),
                t('notificationPreferences.toggles.reengagement.1'),
                n.reengagementReminders ?? true,
                (val) => updateNotifications({ reengagementReminders: val }),
                'toggle-reengagement',
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('notificationPreferences.sections.membership')}</Text>
            <View style={styles.card}>
              {renderToggle(
                <Sparkles size={16} color="#67E8F9" />,
                t('notificationPreferences.toggles.membershipInsights.0'),
                t('notificationPreferences.toggles.membershipInsights.1'),
                n.premiumReflections ?? true,
                (val) => updateNotifications({ premiumReflections: val }),
                'toggle-premium',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Crown size={16} color="#67E8F9" />,
                t('notificationPreferences.toggles.featureReminders.0'),
                t('notificationPreferences.toggles.featureReminders.1'),
                n.premiumInsightReminders ?? true,
                (val) => updateNotifications({ premiumInsightReminders: val }),
                'toggle-premium-insights',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Gift size={16} color="#67E8F9" />,
                t('notificationPreferences.toggles.membershipReminders.0'),
                t('notificationPreferences.toggles.membershipReminders.1'),
                n.upgradeReminders ?? true,
                (val) => updateNotifications({ upgradeReminders: val }),
                'toggle-upgrade-reminders',
              )}
            </View>
            <Text style={styles.premiumNote}>
              {t('notificationPreferences.membershipNote')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('notificationPreferences.sections.smart')}</Text>
            <View style={styles.card}>
              {renderToggle(
                <Heart size={16} color="#14B8A6" />,
                t('notificationPreferences.toggles.behaviorCheckIns.0'),
                t('notificationPreferences.toggles.behaviorCheckIns.1'),
                n.behaviorCheckIns ?? true,
                (val) => updateNotifications({ behaviorCheckIns: val }),
                'toggle-behavior-checkins',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Shield size={16} color={Colors.danger} />,
                t('notificationPreferences.toggles.distressSupport.0'),
                t('notificationPreferences.toggles.distressSupport.1'),
                n.behaviorDistressSupport ?? true,
                (val) => updateNotifications({ behaviorDistressSupport: val }),
                'toggle-behavior-distress',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <FileText size={16} color="#3B82F6" />,
                t('notificationPreferences.toggles.reflectionPrompts.0'),
                t('notificationPreferences.toggles.reflectionPrompts.1'),
                n.behaviorJournalPrompts ?? true,
                (val) => updateNotifications({ behaviorJournalPrompts: val }),
                'toggle-behavior-journal',
              )}
              <View style={styles.divider} />

              {renderToggle(
                <Sparkles size={16} color="#67E8F9" />,
                t('notificationPreferences.toggles.progressCelebrations.0'),
                t('notificationPreferences.toggles.progressCelebrations.1'),
                n.behaviorProgressCelebrations ?? true,
                (val) => updateNotifications({ behaviorProgressCelebrations: val }),
                'toggle-behavior-progress',
              )}
            </View>
            <Text style={styles.premiumNote}>
              {t('notificationPreferences.smartNote')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('notificationPreferences.sections.quiet')}</Text>
            <View style={styles.card}>
              {renderToggle(
                <Moon size={16} color="#3B82F6" />,
                t('notificationPreferences.toggles.quietHours.0'),
                t('notificationPreferences.toggles.quietHours.1'),
                n.quietHoursEnabled ?? false,
                (val) => updateNotifications({ quietHoursEnabled: val }),
                'toggle-quiet-hours',
              )}
              {(n.quietHoursEnabled ?? false) && (
                <View style={styles.quietHoursConfig}>
                  <View style={styles.quietHoursRow}>
                    <View style={styles.quietHoursCol}>
                      <Text style={styles.quietHoursLabel}>{t('notificationPreferences.labels.start')}</Text>
                      {renderTimePicker(
                        'quiet_start',
                        n.quietHoursStart ?? '22:00',
                        QUIET_START_OPTIONS,
                        (val) => updateNotifications({ quietHoursStart: val }),
                      )}
                    </View>
                    <View style={styles.quietHoursDash}>
                      <Text style={styles.quietHoursDashText}>{t('notificationPreferences.labels.to')}</Text>
                    </View>
                    <View style={styles.quietHoursCol}>
                      <Text style={styles.quietHoursLabel}>{t('notificationPreferences.labels.end')}</Text>
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
              {t('notificationPreferences.safetyNote')}
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
