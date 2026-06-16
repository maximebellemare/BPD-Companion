import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Bug,
  Bell,
  BellOff,
  Clock,
  Trash2,
  Play,
  Shield,
  Moon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Navigation,
  BarChart3,
  Zap,
  ArrowRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationScheduler } from '@/services/notifications/notificationScheduler';
import { notificationActionHandler } from '@/services/notifications/notificationActionHandler';
import { notificationRoutingService } from '@/services/notifications/notificationRoutingService';
import { NOTIFICATION_CATEGORIES } from '@/services/notifications/notificationCategories';
import { NotificationDebugEntry, ScheduledReminder, NotificationCategory } from '@/types/notifications';
import { NotificationConversionEvent } from '@/types/notificationRouting';
import { useNotificationEntry } from '@/providers/NotificationEntryProvider';
import { notificationExperimentService, EXPERIMENT_DEFINITIONS } from '@/services/notifications/notificationExperimentService';
import { ExperimentSummary, ExperimentAssignment, ExperimentEvent } from '@/types/notificationExperiment';

export default function NotificationDebugScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [permissionStatus, setPermissionStatus] = useState<string>('loading...');
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [debugLog, setDebugLog] = useState<NotificationDebugEntry[]>([]);
  const [conversions, setConversions] = useState<NotificationConversionEvent[]>([]);
  const [conversionStats, setConversionStats] = useState<{
    totalOpened: number;
    totalCompleted: number;
    totalBounced: number;
    completionRate: number;
    avgDwellTimeMs: number;
  } | null>(null);
  const [_loading, setLoading] = useState(true);
  const { setNotificationEntry } = useNotificationEntry();
  const [experimentSummaries, setExperimentSummaries] = useState<ExperimentSummary[]>([]);
  const [experimentAssignments, setExperimentAssignments] = useState<ExperimentAssignment[]>([]);
  const [experimentEvents, setExperimentEvents] = useState<ExperimentEvent[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await notificationExperimentService.initialize();
      const [status, reminders, log, convHistory, stats] = await Promise.all([
        notificationService.getPermissionStatus(),
        notificationService.getScheduledReminders(),
        notificationService.getDebugLog(50),
        notificationActionHandler.getConversionHistory(20),
        notificationActionHandler.getConversionStats(),
      ]);
      setPermissionStatus(status);
      setScheduledReminders(reminders);
      setDebugLog(log);
      setConversions(convHistory);
      setConversionStats(stats);
      setExperimentSummaries(notificationExperimentService.getAllSummaries());
      setExperimentAssignments(notificationExperimentService.getAllAssignments());
      setExperimentEvents(notificationExperimentService.getRecentEvents(20));
    } catch (error) {
      console.error('[NotificationDebug] Load failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    void loadData();
  }, [fadeAnim, loadData]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleTestNotification = useCallback(async (category: NotificationCategory) => {
    handleHaptic();
    await notificationScheduler.triggerTestNotification(category);
    Alert.alert('Test Sent', `Test notification for "${category}" scheduled in 2 seconds.`);
    setTimeout(() => { void loadData(); }, 1000);
  }, [handleHaptic, loadData]);

  const handleSimulateRouting = useCallback(async (category: NotificationCategory) => {
    handleHaptic();
    try {
      const { route, entryState } = await notificationActionHandler.handleNotificationTap(
        category,
        { category, target_screen: notificationRoutingService.resolveRoute(category), notification_entry: 'true' },
      );
      setNotificationEntry(entryState);
      console.log('[NotificationDebug] Simulating route:', route);
      router.push(route as never);
    } catch (error) {
      console.error('[NotificationDebug] Simulate routing failed:', error);
      Alert.alert('Error', 'Failed to simulate routing');
    }
  }, [handleHaptic, router, setNotificationEntry]);

  const handleClearLog = useCallback(async () => {
    handleHaptic();
    await notificationService.clearDebugLog();
    setDebugLog([]);
  }, [handleHaptic]);

  const handleResetExperiments = useCallback(async () => {
    handleHaptic();
    Alert.alert(
      'Reset Experiments',
      'This will clear all experiment assignments and data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await notificationExperimentService.resetAll();
            setExperimentSummaries([]);
            setExperimentAssignments([]);
            setExperimentEvents([]);
          },
        },
      ],
    );
  }, [handleHaptic]);

  const handleResetSingleExperiment = useCallback(async (experimentId: string) => {
    handleHaptic();
    await notificationExperimentService.resetExperiment(experimentId as ExperimentSummary['experimentId']);
    setExperimentSummaries(notificationExperimentService.getAllSummaries());
    setExperimentAssignments(notificationExperimentService.getAllAssignments());
    setExperimentEvents(notificationExperimentService.getRecentEvents(20));
  }, [handleHaptic]);

  const getConfidenceColor = (confidence: string): string => {
    switch (confidence) {
      case 'high': return Colors.success;
      case 'medium': return Colors.accent;
      default: return Colors.textMuted;
    }
  };

  const getWinnerLabel = (summary: ExperimentSummary): string => {
    if (!summary.winningVariant) return 'No winner yet';
    const def = EXPERIMENT_DEFINITIONS.find(d => d.id === summary.experimentId);
    const variant = def?.variants.find(v => v.id === summary.winningVariant);
    return `${summary.winningVariant}: ${variant?.label ?? 'Unknown'}`;
  };

  const handleCancelAll = useCallback(async () => {
    handleHaptic();
    Alert.alert(
      'Cancel All Reminders',
      'This will cancel all scheduled notifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            await notificationScheduler.cancelAllReminders();
            void loadData();
          },
        },
      ],
    );
  }, [handleHaptic, loadData]);

  const getStatusIcon = (status: string) => {
    if (status === 'granted') return <CheckCircle size={16} color={Colors.success} />;
    if (status === 'denied') return <XCircle size={16} color={Colors.danger} />;
    if (status === 'web_unsupported') return <AlertTriangle size={16} color={Colors.accent} />;
    return <Clock size={16} color={Colors.textMuted} />;
  };

  const getDebugTypeColor = (type: NotificationDebugEntry['type']): string => {
    switch (type) {
      case 'scheduled': return Colors.success;
      case 'triggered': return '#3B82F6';
      case 'cancelled': return Colors.textMuted;
      case 'blocked_quiet': return '#3B82F6';
      case 'blocked_safety': return Colors.danger;
      default: return Colors.textMuted;
    }
  };

  const getDebugTypeLabel = (type: NotificationDebugEntry['type']): string => {
    switch (type) {
      case 'scheduled': return 'SCHEDULED';
      case 'triggered': return 'TRIGGERED';
      case 'cancelled': return 'CANCELLED';
      case 'blocked_quiet': return 'QUIET BLOCK';
      case 'blocked_safety': return 'SAFETY BLOCK';
      default: return String(type).toUpperCase();
    }
  };

  const getOutcomeColor = (outcome: string): string => {
    switch (outcome) {
      case 'completed': return Colors.success;
      case 'bounced': return Colors.danger;
      case 'partial': return Colors.accent;
      default: return Colors.textMuted;
    }
  };

  const formatTimestamp = (ts: number): string => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notification Debug', headerTintColor: Colors.text }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.headerCard}>
            <Bug size={20} color="#3B82F6" />
            <Text style={styles.headerTitle}>Notification Debug</Text>
            <Text style={styles.headerSubtitle}>Deep linking, routing & conversion QA</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PERMISSION STATUS</Text>
            <View style={styles.statusCard}>
              {getStatusIcon(permissionStatus)}
              <Text style={styles.statusText}>{permissionStatus}</Text>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={() => { handleHaptic(); void loadData(); }}
              >
                <RefreshCw size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {conversionStats && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CONVERSION STATS</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{conversionStats.totalOpened}</Text>
                  <Text style={styles.statLabel}>Opened</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: Colors.success }]}>
                    {conversionStats.totalCompleted}
                  </Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: Colors.danger }]}>
                    {conversionStats.totalBounced}
                  </Text>
                  <Text style={styles.statLabel}>Bounced</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>
                    {Math.round(conversionStats.completionRate * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Rate</Text>
                </View>
              </View>
              {conversionStats.avgDwellTimeMs > 0 && (
                <View style={styles.avgDwellCard}>
                  <Clock size={14} color={Colors.textSecondary} />
                  <Text style={styles.avgDwellText}>
                    Avg dwell: {formatDuration(conversionStats.avgDwellTimeMs)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SCHEDULED REMINDERS ({scheduledReminders.length})</Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleCancelAll}
              >
                <Trash2 size={12} color={Colors.danger} />
                <Text style={styles.actionBtnText}>Cancel All</Text>
              </TouchableOpacity>
            </View>
            {scheduledReminders.length === 0 ? (
              <View style={styles.emptyCard}>
                <BellOff size={20} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No scheduled reminders</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {scheduledReminders.map((r, i) => (
                  <View key={r.id} style={[styles.reminderRow, i > 0 && styles.reminderRowBorder]}>
                    <View style={styles.reminderDot}>
                      <Bell size={12} color={Colors.primary} />
                    </View>
                    <View style={styles.reminderContent}>
                      <Text style={styles.reminderCategory}>{r.category}</Text>
                      <Text style={styles.reminderTitle}>{r.title}</Text>
                      <Text style={styles.reminderMeta}>
                        {r.repeating ? 'Repeating' : 'One-time'} · {formatTimestamp(r.scheduledAt)}
                      </Text>
                      {r.data?.target_screen && (
                        <Text style={styles.reminderRoute}>→ {r.data.target_screen}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TEST NOTIFICATIONS</Text>
            <View style={styles.testGrid}>
              {NOTIFICATION_CATEGORIES.slice(0, 8).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.testBtn}
                  onPress={() => handleTestNotification(cat.id)}
                  activeOpacity={0.7}
                  testID={`test-${cat.id}`}
                >
                  <Play size={12} color={Colors.primary} />
                  <Text style={styles.testBtnText} numberOfLines={1}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SIMULATE DEEP LINK ROUTING</Text>
            <Text style={styles.sectionDescription}>
              Tap to simulate a notification tap and test the routing + entry banner.
            </Text>
            <View style={styles.testGrid}>
              {NOTIFICATION_CATEGORIES.map((cat) => {
                const route = notificationRoutingService.resolveRoute(cat.id);
                return (
                  <TouchableOpacity
                    key={`route-${cat.id}`}
                    style={styles.routeTestBtn}
                    onPress={() => handleSimulateRouting(cat.id)}
                    activeOpacity={0.7}
                    testID={`route-test-${cat.id}`}
                  >
                    <Navigation size={12} color="#3B82F6" />
                    <View style={styles.routeTestContent}>
                      <Text style={styles.routeTestLabel} numberOfLines={1}>{cat.label}</Text>
                      <Text style={styles.routeTestRoute} numberOfLines={1}>{route}</Text>
                    </View>
                    <ArrowRight size={12} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RECENT CONVERSIONS ({conversions.length})</Text>
            {conversions.length === 0 ? (
              <View style={styles.emptyCard}>
                <BarChart3 size={20} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No conversion data yet</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {conversions.slice(0, 15).map((conv, i) => (
                  <View key={conv.sessionId} style={[styles.conversionRow, i > 0 && styles.conversionRowBorder]}>
                    <View style={styles.conversionHeader}>
                      <View style={[styles.outcomeBadge, { backgroundColor: getOutcomeColor(conv.outcome) + '18' }]}>
                        <Text style={[styles.outcomeText, { color: getOutcomeColor(conv.outcome) }]}>
                          {conv.outcome.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.conversionCategory}>{conv.category}</Text>
                    </View>
                    <Text style={styles.conversionRoute}>→ {conv.targetRoute}</Text>
                    {conv.quickAction && (
                      <Text style={styles.conversionQuickAction}>Action: {conv.quickAction}</Text>
                    )}
                    <View style={styles.conversionMeta}>
                      <Text style={styles.conversionTime}>{formatTimestamp(conv.openedAt)}</Text>
                      {conv.flowCompletedAt && (
                        <Text style={styles.conversionDuration}>
                          {formatDuration(conv.flowCompletedAt - conv.openedAt)}
                        </Text>
                      )}
                      {conv.distressBefore !== null && conv.distressAfter !== null && (
                        <Text style={styles.conversionDistress}>
                          Distress: {conv.distressBefore} → {conv.distressAfter}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>DEBUG LOG ({debugLog.length})</Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleClearLog}
              >
                <Trash2 size={12} color={Colors.textMuted} />
                <Text style={[styles.actionBtnText, { color: Colors.textMuted }]}>Clear</Text>
              </TouchableOpacity>
            </View>
            {debugLog.length === 0 ? (
              <View style={styles.emptyCard}>
                <Shield size={20} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No debug entries yet</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {debugLog.slice(0, 30).map((entry, i) => (
                  <View key={`${entry.timestamp}_${i}`} style={[styles.logRow, i > 0 && styles.logRowBorder]}>
                    <View style={[styles.logTypeBadge, { backgroundColor: getDebugTypeColor(entry.type) + '18' }]}>
                      <Text style={[styles.logTypeText, { color: getDebugTypeColor(entry.type) }]}>
                        {getDebugTypeLabel(entry.type)}
                      </Text>
                    </View>
                    <Text style={styles.logCategory}>{entry.category}</Text>
                    <Text style={styles.logTitle} numberOfLines={1}>{entry.title}</Text>
                    {entry.reason ? (
                      <Text style={styles.logReason} numberOfLines={2}>{entry.reason}</Text>
                    ) : null}
                    <Text style={styles.logTime}>{formatTimestamp(entry.timestamp)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ROUTE MAP</Text>
            <View style={styles.card}>
              {NOTIFICATION_CATEGORIES.map((cat, i) => {
                const route = notificationRoutingService.resolveRoute(cat.id);
                const entry = notificationRoutingService.getEntryState(cat.id);
                return (
                  <View key={cat.id} style={[styles.routeMapRow, i > 0 && styles.routeMapBorder]}>
                    <View style={styles.routeMapLeft}>
                      <Text style={styles.routeMapCategory}>{cat.id}</Text>
                      <Text style={styles.routeMapRoute}>{route}</Text>
                    </View>
                    <View style={styles.routeMapRight}>
                      <Text style={styles.routeMapEntry} numberOfLines={1}>{entry.title}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>EXPERIMENTS ({experimentSummaries.length})</Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleResetExperiments}
              >
                <Trash2 size={12} color={Colors.danger} />
                <Text style={styles.actionBtnText}>Reset All</Text>
              </TouchableOpacity>
            </View>
            {experimentSummaries.length === 0 ? (
              <View style={styles.emptyCard}>
                <BarChart3 size={20} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No experiment data yet</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {experimentSummaries.map((summary, i) => {
                  const [perfA, perfB] = summary.variants;
                  return (
                    <View key={summary.experimentId} style={[styles.experimentRow, i > 0 && styles.experimentRowBorder]}>
                      <View style={styles.experimentHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.experimentLabel}>{summary.label}</Text>
                          <Text style={styles.experimentCategory}>{summary.category}</Text>
                        </View>
                        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(summary.confidence) + '18' }]}>
                          <Text style={[styles.confidenceText, { color: getConfidenceColor(summary.confidence) }]}>
                            {summary.confidence.toUpperCase()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.experimentResetBtn}
                          onPress={() => handleResetSingleExperiment(summary.experimentId)}
                        >
                          <RefreshCw size={11} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.variantCompare}>
                        <View style={styles.variantCol}>
                          <Text style={styles.variantLabel}>A</Text>
                          <Text style={styles.variantStat}>{perfA.sentCount} sent</Text>
                          <Text style={styles.variantStat}>{Math.round(perfA.openRate * 100)}% open</Text>
                          <Text style={styles.variantStat}>{Math.round(perfA.completionRate * 100)}% complete</Text>
                        </View>
                        <View style={styles.variantDivider} />
                        <View style={styles.variantCol}>
                          <Text style={styles.variantLabel}>B</Text>
                          <Text style={styles.variantStat}>{perfB.sentCount} sent</Text>
                          <Text style={styles.variantStat}>{Math.round(perfB.openRate * 100)}% open</Text>
                          <Text style={styles.variantStat}>{Math.round(perfB.completionRate * 100)}% complete</Text>
                        </View>
                      </View>
                      {summary.winningVariant && (
                        <View style={styles.winnerRow}>
                          <CheckCircle size={12} color={Colors.success} />
                          <Text style={styles.winnerText}>{getWinnerLabel(summary)}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EXPERIMENT ASSIGNMENTS ({experimentAssignments.length})</Text>
            {experimentAssignments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Zap size={20} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No assignments yet</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {experimentAssignments.map((a, i) => {
                  const def = EXPERIMENT_DEFINITIONS.find(d => d.id === a.experimentId);
                  const variant = def?.variants.find(v => v.id === a.variantId);
                  return (
                    <View key={a.experimentId} style={[styles.assignmentRow, i > 0 && styles.assignmentRowBorder]}>
                      <View style={styles.assignmentLeft}>
                        <Text style={styles.assignmentId}>{a.experimentId}</Text>
                        <Text style={styles.assignmentMeta}>
                          Assigned {formatTimestamp(a.assignedAt)}
                        </Text>
                      </View>
                      <View style={styles.assignmentBadge}>
                        <Text style={styles.assignmentVariant}>{a.variantId}</Text>
                      </View>
                      <Text style={styles.assignmentVariantLabel} numberOfLines={1}>
                        {variant?.label ?? 'Unknown'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {experimentEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>RECENT EXPERIMENT EVENTS ({experimentEvents.length})</Text>
              <View style={styles.card}>
                {experimentEvents.slice(0, 15).map((ev, i) => (
                  <View key={`${ev.timestamp}_${i}`} style={[styles.expEventRow, i > 0 && styles.expEventRowBorder]}>
                    <View style={styles.expEventHeader}>
                      <View style={[styles.expEventTypeBadge, { backgroundColor: ev.eventType === 'flow_completed' ? Colors.success + '18' : ev.eventType === 'bounced' ? Colors.danger + '18' : '#3B82F618' }]}>
                        <Text style={[styles.expEventTypeText, { color: ev.eventType === 'flow_completed' ? Colors.success : ev.eventType === 'bounced' ? Colors.danger : '#3B82F6' }]}>
                          {ev.eventType.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.expEventVariant}>{ev.variantId}</Text>
                    </View>
                    <Text style={styles.expEventId}>{ev.experimentId}</Text>
                    <Text style={styles.expEventTime}>{formatTimestamp(ev.timestamp)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SAFETY RULES</Text>
            <View style={styles.card}>
              <View style={styles.ruleRow}>
                <Shield size={14} color={Colors.primary} />
                <Text style={styles.ruleText}>No upgrade prompts during high distress</Text>
              </View>
              <View style={styles.ruleDivider} />
              <View style={styles.ruleRow}>
                <Moon size={14} color="#3B82F6" />
                <Text style={styles.ruleText}>Quiet hours respected for all non-exempt categories</Text>
              </View>
              <View style={styles.ruleDivider} />
              <View style={styles.ruleRow}>
                <AlertTriangle size={14} color={Colors.accent} />
                <Text style={styles.ruleText}>Premium / streak / re-engagement blocked at distress &ge; 7</Text>
              </View>
              <View style={styles.ruleDivider} />
              <View style={styles.ruleRow}>
                <Bell size={14} color={Colors.success} />
                <Text style={styles.ruleText}>No guilt-based or urgency-based copy in templates</Text>
              </View>
              <View style={styles.ruleDivider} />
              <View style={styles.ruleRow}>
                <Navigation size={14} color="#3B82F6" />
                <Text style={styles.ruleText}>All notifications deep-link to specific support flows</Text>
              </View>
              <View style={styles.ruleDivider} />
              <View style={styles.ruleRow}>
                <Zap size={14} color={Colors.accent} />
                <Text style={styles.ruleText}>Entry banners expire after 30 seconds</Text>
              </View>
            </View>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center' as const,
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
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
  sectionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
    marginLeft: 2,
    lineHeight: 17,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  statusCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  avgDwellCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avgDwellText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden' as const,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 24,
    alignItems: 'center' as const,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  actionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  reminderRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: 12,
    gap: 10,
  },
  reminderRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  reminderDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 2,
  },
  reminderContent: {
    flex: 1,
  },
  reminderCategory: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  reminderTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  reminderMeta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  reminderRoute: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
    fontWeight: '500' as const,
  },
  testGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  testBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  routeTestBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    width: '100%',
  },
  routeTestContent: {
    flex: 1,
  },
  routeTestLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  routeTestRoute: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 1,
  },
  conversionRow: {
    padding: 12,
  },
  conversionRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  conversionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  outcomeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  conversionCategory: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  conversionRoute: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  conversionQuickAction: {
    fontSize: 11,
    color: Colors.accent,
    marginBottom: 2,
  },
  conversionMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginTop: 4,
  },
  conversionTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  conversionDuration: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  conversionDistress: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  routeMapRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 10,
    gap: 8,
  },
  routeMapBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  routeMapLeft: {
    flex: 1,
  },
  routeMapCategory: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  routeMapRoute: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 1,
  },
  routeMapRight: {
    flex: 1,
  },
  routeMapEntry: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500' as const,
    textAlign: 'right' as const,
  },
  logRow: {
    padding: 12,
  },
  logRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  logTypeBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  logTypeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  logCategory: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  logReason: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    marginBottom: 2,
  },
  logTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  ruleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    padding: 12,
  },
  ruleDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 12,
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 30,
  },
  experimentRow: {
    padding: 12,
  },
  experimentRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  experimentHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  experimentLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  experimentCategory: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  experimentResetBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  variantCompare: {
    flexDirection: 'row' as const,
    gap: 0,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    overflow: 'hidden' as const,
  },
  variantCol: {
    flex: 1,
    padding: 10,
    alignItems: 'center' as const,
    gap: 3,
  },
  variantLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 2,
  },
  variantStat: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  variantDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  winnerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  winnerText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  assignmentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 10,
    gap: 8,
  },
  assignmentRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  assignmentLeft: {
    flex: 1,
  },
  assignmentId: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  assignmentMeta: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  assignmentBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  assignmentVariant: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  assignmentVariantLabel: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500' as const,
    maxWidth: 100,
  },
  expEventRow: {
    padding: 10,
  },
  expEventRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  expEventHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 3,
  },
  expEventTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  expEventTypeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
  },
  expEventVariant: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  expEventId: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  expEventTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});
