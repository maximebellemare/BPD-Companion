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
import { Stack } from 'expo-router';
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationScheduler } from '@/services/notifications/notificationScheduler';
import { NOTIFICATION_CATEGORIES } from '@/services/notifications/notificationCategories';
import { NotificationDebugEntry, ScheduledReminder, NotificationCategory } from '@/types/notifications';

export default function NotificationDebugScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [permissionStatus, setPermissionStatus] = useState<string>('loading...');
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [debugLog, setDebugLog] = useState<NotificationDebugEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [status, reminders, log] = await Promise.all([
        notificationService.getPermissionStatus(),
        notificationService.getScheduledReminders(),
        notificationService.getDebugLog(50),
      ]);
      setPermissionStatus(status);
      setScheduledReminders(reminders);
      setDebugLog(log);
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

  const handleClearLog = useCallback(async () => {
    handleHaptic();
    await notificationService.clearDebugLog();
    setDebugLog([]);
  }, [handleHaptic]);

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
      case 'blocked_quiet': return '#6366F1';
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
      default: return type.toUpperCase();
    }
  };

  const formatTimestamp = (ts: number): string => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
            <Text style={styles.headerSubtitle}>Internal QA and tuning surface</Text>
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
            <Text style={styles.sectionLabel}>SAFETY RULES</Text>
            <View style={styles.card}>
              <View style={styles.ruleRow}>
                <Shield size={14} color={Colors.primary} />
                <Text style={styles.ruleText}>No upgrade prompts during high distress</Text>
              </View>
              <View style={styles.ruleDivider} />
              <View style={styles.ruleRow}>
                <Moon size={14} color="#6366F1" />
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
    backgroundColor: '#E6F0FF',
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
});
