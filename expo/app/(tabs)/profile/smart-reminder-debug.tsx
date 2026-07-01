import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  RefreshControl,
} from 'react-native';
import { Redirect, Stack } from 'expo-router';
import {
  Zap,
  CheckCircle,
  XCircle,
  RotateCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSmartReminders } from '@/hooks/useSmartReminders';
import { SmartReminderState, ReminderAnalyticsEvent, ReminderDecision } from '@/types/reminderRules';

export default function SmartReminderDebugScreen() {
  if (!__DEV__) {
    return <Redirect href="/(tabs)/profile" />;
  }

  const { getState, getReminderAnalytics, runEvaluation, resetEngine } = useSmartReminders();
  const [state, setState] = useState<SmartReminderState | null>(null);
  const [analytics, setAnalytics] = useState<ReminderAnalyticsEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('state');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    const s = getState();
    setState(s);
    const a = await getReminderAnalytics(30);
    setAnalytics(a);
  }, [getState, getReminderAnalytics]);

  useEffect(() => {
    void loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [loadData, fadeAnim]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleReEvaluate = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await runEvaluation();
    await loadData();
  }, [runEvaluation, loadData]);

  const handleReset = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    await resetEngine();
    await loadData();
  }, [resetEngine, loadData]);

  const toggleSection = useCallback((section: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  const formatTime = useCallback((ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }, []);

  const renderDecision = useCallback((d: ReminderDecision, index: number) => (
    <View key={`${d.ruleId}-${index}`} style={styles.decisionCard}>
      <View style={styles.decisionHeader}>
        <View style={[styles.decisionDot, { backgroundColor: d.shouldFire ? Colors.success : Colors.textMuted }]} />
        <Text style={styles.decisionRule}>{d.ruleId}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(d.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(d.priority) }]}>
            {d.priorityScore}
          </Text>
        </View>
      </View>
      <Text style={styles.decisionCategory}>{d.category} · {d.priority}</Text>
      <Text style={styles.decisionReason}>{d.reason}</Text>
      {d.personalizedCopy && (
        <View style={styles.copyPreview}>
          <Text style={styles.copyTitle}>{d.personalizedCopy.title}</Text>
          <Text style={styles.copyBody}>{d.personalizedCopy.body}</Text>
        </View>
      )}
      <Text style={styles.decisionDeepLink}>→ {d.deepLink}</Text>
    </View>
  ), []);

  const renderAnalyticsEvent = useCallback((event: ReminderAnalyticsEvent, index: number) => (
    <View key={`${event.ruleId}-${event.timestamp}-${index}`} style={styles.analyticsCard}>
      <View style={styles.analyticsHeader}>
        <View style={[styles.eventTypeBadge, { backgroundColor: getEventTypeColor(event.eventType) + '20' }]}>
          <Text style={[styles.eventTypeText, { color: getEventTypeColor(event.eventType) }]}>
            {event.eventType}
          </Text>
        </View>
        <Text style={styles.analyticsCategory}>{event.category}</Text>
      </View>
      <Text style={styles.analyticsReason}>{event.reason}</Text>
      <Text style={styles.analyticsTime}>{formatTime(event.timestamp)}</Text>
    </View>
  ), [formatTime]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Smart Reminder Debug', headerTintColor: Colors.text }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleReEvaluate} activeOpacity={0.7}>
              <RotateCw size={14} color={Colors.primary} />
              <Text style={styles.actionBtnText}>Re-evaluate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleReset} activeOpacity={0.7}>
              <Trash2 size={14} color={Colors.danger} />
              <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          {state && (
            <>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('state')} activeOpacity={0.7}>
                <View style={styles.sectionHeaderLeft}>
                  <Zap size={16} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Engine State</Text>
                </View>
                {expandedSection === 'state' ? (
                  <ChevronUp size={16} color={Colors.textMuted} />
                ) : (
                  <ChevronDown size={16} color={Colors.textMuted} />
                )}
              </TouchableOpacity>

              {expandedSection === 'state' && (
                <View style={styles.stateCard}>
                  <View style={styles.stateRow}>
                    <Text style={styles.stateLabel}>Last evaluation</Text>
                    <Text style={styles.stateValue}>
                      {state.lastEvaluationTime ? formatTime(state.lastEvaluationTime) : 'Never'}
                    </Text>
                  </View>
                  <View style={styles.stateDivider} />
                  <View style={styles.stateRow}>
                    <Text style={styles.stateLabel}>Today fired</Text>
                    <Text style={styles.stateValue}>{state.todayFiredCount}</Text>
                  </View>
                  <View style={styles.stateDivider} />
                  <View style={styles.stateRow}>
                    <Text style={styles.stateLabel}>Today categories</Text>
                    <Text style={styles.stateValue}>
                      {state.todayFiredCategories.length > 0
                        ? state.todayFiredCategories.join(', ')
                        : 'None'}
                    </Text>
                  </View>
                  <View style={styles.stateDivider} />
                  <View style={styles.stateRow}>
                    <Text style={styles.stateLabel}>Last fired</Text>
                    <Text style={styles.stateValue}>
                      {state.lastFiredTimestamp ? formatTime(state.lastFiredTimestamp) : 'Never'}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('active')} activeOpacity={0.7}>
            <View style={styles.sectionHeaderLeft}>
              <CheckCircle size={16} color={Colors.success} />
              <Text style={styles.sectionTitle}>Active Decisions ({state?.activeReminders.length ?? 0})</Text>
            </View>
            {expandedSection === 'active' ? (
              <ChevronUp size={16} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={16} color={Colors.textMuted} />
            )}
          </TouchableOpacity>

          {expandedSection === 'active' && (
            <View style={styles.decisionsContainer}>
              {(state?.activeReminders ?? []).length === 0 ? (
                <Text style={styles.emptyText}>No active reminders right now</Text>
              ) : (
                state?.activeReminders.map((d, i) => renderDecision(d, i))
              )}
            </View>
          )}

          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('suppressed')} activeOpacity={0.7}>
            <View style={styles.sectionHeaderLeft}>
              <XCircle size={16} color={Colors.textMuted} />
              <Text style={styles.sectionTitle}>Suppressed ({state?.suppressedReminders.length ?? 0})</Text>
            </View>
            {expandedSection === 'suppressed' ? (
              <ChevronUp size={16} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={16} color={Colors.textMuted} />
            )}
          </TouchableOpacity>

          {expandedSection === 'suppressed' && (
            <View style={styles.decisionsContainer}>
              {(state?.suppressedReminders ?? []).length === 0 ? (
                <Text style={styles.emptyText}>No suppressed reminders</Text>
              ) : (
                state?.suppressedReminders.map((d, i) => renderDecision(d, i))
              )}
            </View>
          )}

          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('analytics')} activeOpacity={0.7}>
            <View style={styles.sectionHeaderLeft}>
              <BarChart3 size={16} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Reminder Analytics ({analytics.length})</Text>
            </View>
            {expandedSection === 'analytics' ? (
              <ChevronUp size={16} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={16} color={Colors.textMuted} />
            )}
          </TouchableOpacity>

          {expandedSection === 'analytics' && (
            <View style={styles.decisionsContainer}>
              {analytics.length === 0 ? (
                <Text style={styles.emptyText}>No reminder analytics yet</Text>
              ) : (
                analytics.map((e, i) => renderAnalyticsEvent(e, i))
              )}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical_support': return Colors.danger;
    case 'high_value_support': return '#3B82F6';
    case 'routine_support': return Colors.primary;
    case 'premium_insight': return '#3B82F6';
    case 'reengagement': return Colors.textMuted;
    default: return Colors.textSecondary;
  }
}

function getEventTypeColor(type: string): string {
  switch (type) {
    case 'scheduled': return Colors.primary;
    case 'delivered': return Colors.success;
    case 'opened': return '#3B82F6';
    case 'dismissed': return Colors.textMuted;
    case 'converted': return '#3B82F6';
    case 'suppressed': return '#3B82F6';
    default: return Colors.textSecondary;
  }
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
    padding: 20,
  },
  actionRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  actionBtnDanger: {
    backgroundColor: Colors.dangerLight,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stateCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  stateRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  stateLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  stateValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
    maxWidth: '60%' as const,
    textAlign: 'right' as const,
  },
  stateDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  decisionsContainer: {
    marginTop: 10,
    marginBottom: 6,
    gap: 8,
  },
  decisionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 14,
  },
  decisionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 6,
  },
  decisionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  decisionRule: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  decisionCategory: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  decisionReason: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 6,
  },
  copyPreview: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  copyTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  copyBody: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  decisionDeepLink: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  analyticsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 12,
  },
  analyticsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 6,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  analyticsCategory: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  analyticsReason: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  analyticsTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    paddingVertical: 20,
    fontStyle: 'italic' as const,
  },
  bottomSpacer: {
    height: 40,
  },
});
