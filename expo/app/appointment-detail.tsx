import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  ChevronRight,
  Edit3,
  Trash2,
  CheckCircle2,
  FileText,
  Lightbulb,
  BookOpen,
  Pill,
  TrendingUp,
  MessageCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppointments } from '@/providers/AppointmentProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_COLORS,
  LOCATION_TYPE_LABELS,
  PRE_SESSION_PROMPTS,
  PreSessionNotes,
  PostSessionNotes,
  formatAppointmentDate,
  formatAppointmentTime,
  isAppointmentPast,
} from '@/types/appointment';

type TabMode = 'overview' | 'pre_session' | 'post_session';

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const appointmentContext = useAppointments();
  const getAppointmentById = appointmentContext?.getAppointmentById ?? (() => null);
  const deleteAppointment = appointmentContext?.deleteAppointment ?? (async () => undefined);
  const savePreSessionNotes = appointmentContext?.savePreSessionNotes ?? (async () => null);
  const savePostSessionNotes = appointmentContext?.savePostSessionNotes ?? (async () => null);
  const markCompleted = appointmentContext?.markCompleted ?? (async () => null);
  const isSavingPreSession = appointmentContext?.isSavingPreSession ?? false;
  const isSavingPostSession = appointmentContext?.isSavingPostSession ?? false;

  const appointment = getAppointmentById(params.id ?? '');
  const isPast = appointment ? isAppointmentPast(appointment) : false;

  const [activeTab, setActiveTab] = useState<TabMode>(
    isPast && !appointment?.postSessionNotes ? 'post_session' :
    !isPast && !appointment?.preSessionNotes ? 'pre_session' : 'overview'
  );

  const [preNotes, setPreNotes] = useState<Record<string, string>>({
    hardestLately: appointment?.preSessionNotes?.hardestLately ?? '',
    relationshipPatterns: appointment?.preSessionNotes?.relationshipPatterns ?? '',
    questionsToAsk: appointment?.preSessionNotes?.questionsToAsk ?? '',
    medicationNotes: appointment?.preSessionNotes?.medicationNotes ?? '',
    progressOrSetbacks: appointment?.preSessionNotes?.progressOrSetbacks ?? '',
  });

  const [postNotes, setPostNotes] = useState({
    whatStoodOut: appointment?.postSessionNotes?.whatStoodOut ?? '',
    remember: appointment?.postSessionNotes?.remember ?? '',
    actionItems: appointment?.postSessionNotes?.actionItems ?? '',
    followUpQuestions: appointment?.postSessionNotes?.followUpQuestions ?? '',
    mainTakeaways: appointment?.postSessionNotes?.mainTakeaways ?? '',
    newCopingTools: appointment?.postSessionNotes?.newCopingTools ?? '',
    thingsToPractice: appointment?.postSessionNotes?.thingsToPractice ?? '',
    nextAppointmentNotes: appointment?.postSessionNotes?.nextAppointmentNotes ?? '',
    medicationChanges: appointment?.postSessionNotes?.medicationChanges ?? '',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'appointment_detail' });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, trackEvent]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleEdit = useCallback(() => {
    if (!appointment) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/appointment-add?editId=${appointment.id}` as any);
  }, [appointment, router]);

  const handleDelete = useCallback(() => {
    if (!appointment) return;
    Alert.alert(
      'Delete Appointment',
      `Remove "${appointment.providerName}" appointment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await deleteAppointment(appointment.id);
            trackEvent('appointment_deleted');
            router.back();
          },
        },
      ],
    );
  }, [appointment, deleteAppointment, trackEvent, router]);

  const handleSavePreSession = useCallback(async () => {
    if (!appointment) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const notes: PreSessionNotes = {
      hardestLately: preNotes.hardestLately,
      relationshipPatterns: preNotes.relationshipPatterns,
      questionsToAsk: preNotes.questionsToAsk,
      medicationNotes: preNotes.medicationNotes,
      progressOrSetbacks: preNotes.progressOrSetbacks,
      importedInsights: [],
      savedAt: Date.now(),
    };
    await savePreSessionNotes(appointment.id, notes);
    trackEvent('pre_session_note_saved', { appointment_type: appointment.appointmentType });
    Alert.alert('Saved', 'Your pre-session notes have been saved.');
  }, [appointment, preNotes, savePreSessionNotes, trackEvent]);

  const handleSavePostSession = useCallback(async () => {
    if (!appointment) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const notes: PostSessionNotes = {
      whatStoodOut: postNotes.whatStoodOut,
      remember: postNotes.remember,
      actionItems: postNotes.actionItems,
      followUpQuestions: postNotes.followUpQuestions,
      mainTakeaways: postNotes.mainTakeaways,
      newCopingTools: postNotes.newCopingTools,
      thingsToPractice: postNotes.thingsToPractice,
      nextAppointmentNotes: postNotes.nextAppointmentNotes,
      medicationChanges: postNotes.medicationChanges,
      savedAt: Date.now(),
    };
    await savePostSessionNotes(appointment.id, notes);
    trackEvent('post_session_note_saved', { appointment_type: appointment.appointmentType });
    trackEvent('appointment_completed', { appointment_type: appointment.appointmentType });
    Alert.alert('Saved', 'Session notes saved and appointment marked complete.');
  }, [appointment, postNotes, savePostSessionNotes, trackEvent]);

  const handleMarkComplete = useCallback(async () => {
    if (!appointment) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await markCompleted(appointment.id);
    trackEvent('appointment_completed', { appointment_type: appointment.appointmentType });
    setActiveTab('post_session');
    Alert.alert(
      'Appointment completed',
      'Take a minute to save what stood out while it is still fresh.',
    );
  }, [appointment, markCompleted, trackEvent]);

  const LocationIcon = appointment?.locationType === 'telehealth' ? Video :
    appointment?.locationType === 'phone' ? Phone : MapPin;

  if (!appointment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Appointment Not Found</Text>
          <TouchableOpacity style={styles.emptyAction} onPress={handleClose}>
            <Text style={styles.emptyActionText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const typeColor = APPOINTMENT_TYPE_COLORS[appointment.appointmentType];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.topBarActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.actionBtn}>
            <Edit3 size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <Trash2 size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.headerCard}>
              <View style={[styles.headerTypeBar, { backgroundColor: typeColor }]} />
              <View style={styles.headerContent}>
                <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
                  <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                    {APPOINTMENT_TYPE_LABELS[appointment.appointmentType]}
                  </Text>
                </View>
                <Text style={styles.headerProvider}>{appointment.providerName}</Text>
                <View style={styles.headerMeta}>
                  <View style={styles.metaItem}>
                    <Calendar size={15} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{formatAppointmentDate(appointment.dateTime)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={15} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{formatAppointmentTime(appointment.dateTime)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <LocationIcon size={15} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {LOCATION_TYPE_LABELS[appointment.locationType]}
                      {appointment.locationDetail ? ` · ${appointment.locationDetail}` : ''}
                    </Text>
                  </View>
                </View>

                {appointment.completed && (
                  <View style={styles.completedBadge}>
                    <CheckCircle2 size={14} color={Colors.success} />
                    <Text style={styles.completedBadgeText}>Completed</Text>
                  </View>
                )}
              </View>
            </View>

            {appointment.topicsToDiscuss.length > 0 && (
              <View style={styles.topicsCard}>
                <View style={styles.topicsHeader}>
                  <FileText size={16} color={Colors.primaryDark} />
                  <Text style={styles.topicsTitle}>Topics to Discuss</Text>
                </View>
                {appointment.topicsToDiscuss.map((topic, i) => (
                  <View key={i} style={styles.topicItem}>
                    <View style={styles.topicBullet} />
                    <Text style={styles.topicText}>{topic}</Text>
                  </View>
                ))}
              </View>
            )}

            {appointment.notes ? (
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{appointment.notes}</Text>
              </View>
            ) : null}

            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
                onPress={() => setActiveTab('overview')}
              >
                <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'pre_session' && styles.tabActive]}
                onPress={() => setActiveTab('pre_session')}
              >
                <Text style={[styles.tabText, activeTab === 'pre_session' && styles.tabTextActive]}>Pre-Session</Text>
                {appointment.preSessionNotes && <View style={styles.tabDot} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'post_session' && styles.tabActive]}
                onPress={() => setActiveTab('post_session')}
              >
                <Text style={[styles.tabText, activeTab === 'post_session' && styles.tabTextActive]}>Post-Session</Text>
                {appointment.postSessionNotes && <View style={styles.tabDot} />}
              </TouchableOpacity>
            </View>

            {activeTab === 'overview' && (
              <View style={styles.overviewSection}>
                {!appointment.completed && isPast && (
                  <TouchableOpacity style={styles.completeBtn} onPress={handleMarkComplete} activeOpacity={0.7}>
                    <CheckCircle2 size={18} color={Colors.white} />
                    <Text style={styles.completeBtnText}>Mark as Completed</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.linkCard}
                  onPress={() => router.push('/therapy-report')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.linkIcon, { backgroundColor: Colors.primaryLight }]}>
                    <TrendingUp size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.linkContent}>
                    <Text style={styles.linkTitle}>Therapy Report</Text>
                    <Text style={styles.linkDesc}>View your emotional summary for this period</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkCard}
                  onPress={() => router.push('/weekly-reflection' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.linkIcon, { backgroundColor: '#FFFFFF' }]}>
                    <BookOpen size={16} color="#3B82F6" />
                  </View>
                  <View style={styles.linkContent}>
                    <Text style={styles.linkTitle}>Weekly Reflection</Text>
                    <Text style={styles.linkDesc}>Review your weekly narrative</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'pre_session' && (
              <View style={styles.sessionSection}>
                <Text style={styles.sessionIntro}>
                  Prepare for your session. These notes can help you make the most of your time.
                </Text>

                {PRE_SESSION_PROMPTS.map(prompt => (
                  <View key={prompt.key} style={styles.promptGroup}>
                    <View style={styles.promptHeader}>
                      {prompt.key === 'hardestLately' && <Lightbulb size={14} color={Colors.accent} />}
                      {prompt.key === 'relationshipPatterns' && <MessageCircle size={14} color="#3B82F6" />}
                      {prompt.key === 'questionsToAsk' && <FileText size={14} color={Colors.primary} />}
                      {prompt.key === 'medicationNotes' && <Pill size={14} color="#3B82F6" />}
                      {prompt.key === 'progressOrSetbacks' && <TrendingUp size={14} color={Colors.success} />}
                      <Text style={styles.promptLabel}>{prompt.label}</Text>
                    </View>
                    <TextInput
                      style={[styles.promptInput, preNotes[prompt.key]?.length > 0 && styles.promptInputFilled]}
                      value={preNotes[prompt.key] ?? ''}
                      onChangeText={(text) => setPreNotes(prev => ({ ...prev, [prompt.key]: text }))}
                      placeholder={prompt.placeholder}
                      placeholderTextColor={Colors.textMuted}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.saveSessionBtn, isSavingPreSession && { opacity: 0.6 }]}
                  onPress={handleSavePreSession}
                  disabled={isSavingPreSession}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveSessionBtnText}>
                    {isSavingPreSession ? 'Saving…' : 'Save Pre-Session Notes'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'post_session' && (
              <View style={styles.sessionSection}>
                <Text style={styles.sessionIntro}>
                  Save the pieces you may want to remember later. Companion can use these notes gently when they are relevant.
                </Text>

                <View style={styles.promptGroup}>
                  <View style={styles.promptHeader}>
                    <Lightbulb size={14} color={Colors.accent} />
                    <Text style={styles.promptLabel}>What stood out?</Text>
                  </View>
                  <TextInput
                    style={[styles.promptInput, postNotes.whatStoodOut.length > 0 && styles.promptInputFilled]}
                    value={postNotes.whatStoodOut}
                    onChangeText={(text) => setPostNotes(prev => ({ ...prev, whatStoodOut: text }))}
                    placeholder="A moment, phrase, idea, or feeling you do not want to lose..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.promptGroup}>
                  <View style={styles.promptHeader}>
                    <BookOpen size={14} color="#3B82F6" />
                    <Text style={styles.promptLabel}>What do you want to remember?</Text>
                  </View>
                  <TextInput
                    style={[styles.promptInput, postNotes.remember.length > 0 && styles.promptInputFilled]}
                    value={postNotes.remember}
                    onChangeText={(text) => setPostNotes(prev => ({ ...prev, remember: text }))}
                    placeholder="Something your provider suggested, something you realized, or a reminder for yourself..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.promptGroup}>
                  <View style={styles.promptHeader}>
                    <TrendingUp size={14} color={Colors.success} />
                    <Text style={styles.promptLabel}>Any action items?</Text>
                  </View>
                  <TextInput
                    style={[styles.promptInput, postNotes.actionItems.length > 0 && styles.promptInputFilled]}
                    value={postNotes.actionItems}
                    onChangeText={(text) => setPostNotes(prev => ({ ...prev, actionItems: text }))}
                    placeholder="Practice a skill, track something, bring up a topic, book a follow-up..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.promptGroup}>
                  <View style={styles.promptHeader}>
                    <MessageCircle size={14} color={Colors.primary} />
                    <Text style={styles.promptLabel}>Any follow-up questions?</Text>
                  </View>
                  <TextInput
                    style={[styles.promptInput, postNotes.followUpQuestions.length > 0 && styles.promptInputFilled]}
                    value={postNotes.followUpQuestions}
                    onChangeText={(text) => setPostNotes(prev => ({ ...prev, followUpQuestions: text }))}
                    placeholder="Questions to ask next time, or things you want to understand better..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.promptGroup}>
                  <View style={styles.promptHeader}>
                    <FileText size={14} color={Colors.textSecondary} />
                    <Text style={styles.promptLabel}>Other notes</Text>
                  </View>
                  <TextInput
                    style={[styles.promptInput, postNotes.mainTakeaways.length > 0 && styles.promptInputFilled]}
                    value={postNotes.mainTakeaways}
                    onChangeText={(text) => setPostNotes(prev => ({ ...prev, mainTakeaways: text }))}
                    placeholder="Anything else you want to keep..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.promptGroup}>
                  <View style={styles.promptHeader}>
                    <Pill size={14} color="#3B82F6" />
                    <Text style={styles.promptLabel}>Medication or care notes</Text>
                  </View>
                  <TextInput
                    style={[styles.promptInput, postNotes.medicationChanges.length > 0 && styles.promptInputFilled]}
                    value={postNotes.medicationChanges}
                    onChangeText={(text) => setPostNotes(prev => ({ ...prev, medicationChanges: text }))}
                    placeholder="Medication changes, side effects to monitor, or provider instructions..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveSessionBtn, isSavingPostSession && { opacity: 0.6 }]}
                  onPress={handleSavePostSession}
                  disabled={isSavingPostSession}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveSessionBtnText}>
                    {isSavingPostSession ? 'Saving…' : 'Save & Complete Session'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  headerTypeBar: {
    height: 4,
  },
  headerContent: {
    padding: 20,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  headerProvider: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  headerMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: Colors.successLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  topicsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  topicsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  topicsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  topicBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
  },
  topicText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
  },
  notesCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  tabActive: {
    backgroundColor: Colors.card,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: '600' as const,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  overviewSection: {
    gap: 12,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  completeBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  linkDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sessionSection: {
    gap: 0,
  },
  sessionIntro: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  promptGroup: {
    marginBottom: 18,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  promptInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 70,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    lineHeight: 21,
  },
  promptInputFilled: {
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primaryLight + '40',
  },
  saveSessionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  saveSessionBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  emptyAction: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
