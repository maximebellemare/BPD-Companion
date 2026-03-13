import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Stack } from 'expo-router';
import {
  BarChart3,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Eye,
  TrendingUp,
  Crown,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useEmotionalContext } from '@/providers/EmotionalContextProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { AnalyticsEvent, AnalyticsSummary } from '@/types/analytics';
import { PREMIUM_FEATURES } from '@/types/subscription';

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

interface EventRowProps {
  event: AnalyticsEvent;
}

function EventRow({ event }: EventRowProps) {
  const [expanded, setExpanded] = useState(false);

  const categoryColor = getEventCategoryColor(event.name);

  return (
    <TouchableOpacity
      style={styles.eventRow}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.eventRowHeader}>
        <View style={[styles.eventDot, { backgroundColor: categoryColor }]} />
        <View style={styles.eventRowContent}>
          <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
          <Text style={styles.eventTime}>{formatRelativeTime(event.timestamp)}</Text>
        </View>
        {event.properties && Object.keys(event.properties).length > 0 && (
          expanded
            ? <ChevronUp size={14} color={Colors.textMuted} />
            : <ChevronDown size={14} color={Colors.textMuted} />
        )}
      </View>
      {expanded && event.properties && Object.keys(event.properties).length > 0 && (
        <View style={styles.eventProperties}>
          {Object.entries(event.properties).map(([key, value]) => (
            <View key={key} style={styles.propertyRow}>
              <Text style={styles.propertyKey}>{key}</Text>
              <Text style={styles.propertyValue}>{String(value)}</Text>
            </View>
          ))}
          <Text style={styles.eventTimestamp}>{formatTimestamp(event.timestamp)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function getEventCategoryColor(name: string): string {
  if (name.startsWith('relationship_') || name.startsWith('message_')) return '#E84393';
  if (name.startsWith('crisis_') || name === 'safety_mode_activated') return Colors.danger;
  if (name.startsWith('ai_')) return '#8B5CF6';
  if (name.startsWith('flow_')) return '#3B82F6';
  if (name.includes('upgrade') || name.includes('premium') || name.includes('locked') || name.includes('limit')) return '#D4956A';
  if (name === 'screen_view') return Colors.textMuted;
  if (name === 'check_in_completed' || name === 'journal_entry_created') return Colors.primary;
  if (name.includes('regulation') || name.includes('grounding') || name.includes('dbt')) return Colors.success;
  return Colors.textSecondary;
}

export default function AnalyticsDebugScreen() {
  const { getSummary, getRecentEvents, clearEvents, trackEvent } = useAnalytics();
  const emotionalContext = useEmotionalContext();
  const { tier, isPremium, canAccessFeature, dailyAIUsage, aiLimitReached, remainingAIMessages } = useSubscription();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'summary' | 'flows' | 'premium' | 'context'>('events');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const [summaryData, events] = await Promise.all([
        getSummary(),
        getRecentEvents(100),
      ]);
      setSummary(summaryData);
      setRecentEvents(events);
      console.log('[AnalyticsDebug] Loaded', events.length, 'events');
    } catch (error) {
      console.log('[AnalyticsDebug] Error loading data:', error);
    }
  }, [getSummary, getRecentEvents]);

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
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleClear = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    await clearEvents();
    await loadData();
  }, [clearEvents, loadData]);

  const handleTestEvent = useCallback(() => {
    trackEvent('debug_test_event', { source: 'debug_panel', timestamp: Date.now() });
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTimeout(() => void loadData(), 500);
  }, [trackEvent, loadData]);

  const topEvents = summary
    ? Object.entries(summary.eventCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  const topScreens = summary
    ? Object.entries(summary.screenViews)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  const premiumSignals = summary
    ? Object.entries(summary.premiumSignals)
        .sort((a, b) => b[1] - a[1])
    : [];

  const flowRates = summary
    ? Object.entries(summary.flowCompletionRates)
        .sort((a, b) => b[1].started - a[1].started)
    : [];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Analytics Debug', headerShown: true }} />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.statsBar}>
          <View style={styles.statPill}>
            <Activity size={12} color={Colors.primary} />
            <Text style={styles.statPillText}>{summary?.totalEvents ?? 0} events</Text>
          </View>
          <View style={styles.statPill}>
            <Eye size={12} color="#3B82F6" />
            <Text style={styles.statPillText}>
              {Object.keys(summary?.screenViews ?? {}).length} screens
            </Text>
          </View>
          <View style={styles.statPill}>
            <TrendingUp size={12} color={Colors.success} />
            <Text style={styles.statPillText}>
              {Object.keys(summary?.flowCompletionRates ?? {}).length} flows
            </Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          {(['events', 'context', 'summary', 'flows', 'premium'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'events' ? 'Live' : tab === 'context' ? 'State' : tab === 'summary' ? 'Summary' : tab === 'flows' ? 'Flows' : 'Premium'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
        >
          {activeTab === 'events' && (
            <>
              <View style={styles.actionBar}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleTestEvent}>
                  <Zap size={14} color={Colors.primary} />
                  <Text style={styles.actionBtnText}>Test Event</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleRefresh}>
                  <RefreshCw size={14} color="#3B82F6" />
                  <Text style={styles.actionBtnText}>Refresh</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleClear}>
                  <Trash2 size={14} color={Colors.danger} />
                  <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>Clear</Text>
                </TouchableOpacity>
              </View>

              {recentEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <BarChart3 size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>No events yet</Text>
                  <Text style={styles.emptyDesc}>
                    Events will appear here as you use the app
                  </Text>
                </View>
              ) : (
                <View style={styles.eventList}>
                  {recentEvents.map(event => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === 'summary' && (
            <>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Top Events</Text>
                {topEvents.length === 0 ? (
                  <Text style={styles.noData}>No events tracked yet</Text>
                ) : (
                  topEvents.map(([name, count]) => (
                    <View key={name} style={styles.metricRow}>
                      <View style={[styles.metricDot, { backgroundColor: getEventCategoryColor(name) }]} />
                      <Text style={styles.metricName} numberOfLines={1}>{name}</Text>
                      <View style={styles.metricBadge}>
                        <Text style={styles.metricCount}>{count}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Screen Views</Text>
                {topScreens.length === 0 ? (
                  <Text style={styles.noData}>No screen views tracked yet</Text>
                ) : (
                  topScreens.map(([screen, count]) => (
                    <View key={screen} style={styles.metricRow}>
                      <Eye size={12} color={Colors.textMuted} />
                      <Text style={styles.metricName} numberOfLines={1}>{screen}</Text>
                      <View style={styles.metricBadge}>
                        <Text style={styles.metricCount}>{count}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {activeTab === 'flows' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Flow Completion Rates</Text>
              {flowRates.length === 0 ? (
                <Text style={styles.noData}>No flows tracked yet</Text>
              ) : (
                flowRates.map(([flow, { started, completed }]) => {
                  const rate = started > 0 ? Math.round((completed / started) * 100) : 0;
                  return (
                    <View key={flow} style={styles.flowRow}>
                      <View style={styles.flowInfo}>
                        <Text style={styles.flowName}>{flow}</Text>
                        <Text style={styles.flowStats}>
                          {started} started · {completed} completed
                        </Text>
                      </View>
                      <View style={styles.flowRateContainer}>
                        <View style={styles.flowRateBar}>
                          <View
                            style={[
                              styles.flowRateFill,
                              { width: `${rate}%` },
                              rate >= 70
                                ? styles.flowRateGood
                                : rate >= 40
                                ? styles.flowRateOk
                                : styles.flowRateLow,
                            ]}
                          />
                        </View>
                        <Text style={styles.flowRateText}>{rate}%</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {activeTab === 'context' && (
            <>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Emotional Zone</Text>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Zone</Text>
                  <View style={[styles.contextBadge, { backgroundColor: getZoneColor(emotionalContext.zone) + '20' }]}>
                    <View style={[styles.contextDot, { backgroundColor: getZoneColor(emotionalContext.zone) }]} />
                    <Text style={[styles.contextBadgeText, { color: getZoneColor(emotionalContext.zone) }]}>
                      {emotionalContext.zone}
                    </Text>
                  </View>
                </View>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Journey Phase</Text>
                  <Text style={styles.contextValue}>{emotionalContext.journeyPhase}</Text>
                </View>
                {emotionalContext.journeyLabel && (
                  <View style={styles.contextRow}>
                    <Text style={styles.contextLabel}>Label</Text>
                    <Text style={styles.contextValue} numberOfLines={2}>{emotionalContext.journeyLabel}</Text>
                  </View>
                )}
                {emotionalContext.journeySuggestion && (
                  <View style={styles.contextRow}>
                    <Text style={styles.contextLabel}>Suggestion</Text>
                    <Text style={styles.contextValue}>{emotionalContext.journeySuggestion.label}</Text>
                  </View>
                )}
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Active Context</Text>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Latest Trigger</Text>
                  <Text style={styles.contextValue}>{emotionalContext.activeContext.latestTrigger ?? '—'}</Text>
                </View>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Latest Emotion</Text>
                  <Text style={styles.contextValue}>{emotionalContext.activeContext.latestEmotion ?? '—'}</Text>
                </View>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Latest Urge</Text>
                  <Text style={styles.contextValue}>{emotionalContext.activeContext.latestUrge ?? '—'}</Text>
                </View>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Intensity</Text>
                  <Text style={styles.contextValue}>{emotionalContext.activeContext.latestIntensity}/10</Text>
                </View>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Relationship Active</Text>
                  <Text style={styles.contextValue}>{emotionalContext.activeContext.activeRelationshipContext ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>High Distress</Text>
                  <Text style={styles.contextValue}>{emotionalContext.activeContext.highDistressRecent ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Rewrites (week)</Text>
                  <Text style={styles.contextValue}>{emotionalContext.activeContext.recentRewriteCount}</Text>
                </View>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Pauses (week)</Text>
                  <Text style={styles.contextValue}>{emotionalContext.activeContext.recentPauseCount}</Text>
                </View>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Check-ins (week)</Text>
                  <Text style={styles.contextValue}>{emotionalContext.activeContext.recentCheckInCount}</Text>
                </View>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Top Coping</Text>
                  <Text style={styles.contextValue}>{emotionalContext.activeContext.topCopingRecommendation ?? '—'}</Text>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Premium Gate Status</Text>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Tier</Text>
                  <View style={[styles.contextBadge, { backgroundColor: isPremium ? Colors.successLight : Colors.surface }]}>
                    <Text style={[styles.contextBadgeText, { color: isPremium ? Colors.success : Colors.textSecondary }]}>
                      {tier}
                    </Text>
                  </View>
                </View>
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>AI Usage Today</Text>
                  <Text style={styles.contextValue}>{dailyAIUsage} ({aiLimitReached ? 'LIMIT REACHED' : `${remainingAIMessages} remaining`})</Text>
                </View>
                {PREMIUM_FEATURES.slice(0, 6).map(f => (
                  <View key={f.id} style={styles.contextRow}>
                    <Text style={styles.contextLabel} numberOfLines={1}>{f.title}</Text>
                    <View style={[styles.contextBadge, { backgroundColor: canAccessFeature(f.id) ? Colors.successLight : '#FFF0E3' }]}>
                      <Text style={[styles.contextBadgeText, { color: canAccessFeature(f.id) ? Colors.success : '#D4956A' }]}>
                        {canAccessFeature(f.id) ? 'Unlocked' : 'Locked'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Outcomes Recorded</Text>
                <Text style={styles.contextValue}>{emotionalContext.outcomes.length} total</Text>
                {emotionalContext.outcomes.slice(0, 5).map((o, i) => (
                  <View key={o.id} style={[styles.contextRow, i === 0 && { marginTop: 8 }]}>
                    <Text style={styles.contextLabel}>{formatRelativeTime(o.timestamp)}</Text>
                    <Text style={styles.contextValue}>{o.outcome}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {activeTab === 'premium' && (
            <View style={styles.sectionCard}>
              <View style={styles.premiumHeader}>
                <Crown size={16} color="#D4956A" />
                <Text style={styles.sectionTitle}>Premium Conversion Signals</Text>
              </View>
              {premiumSignals.length === 0 ? (
                <Text style={styles.noData}>No premium signals tracked yet</Text>
              ) : (
                premiumSignals.map(([signal, count]) => (
                  <View key={signal} style={styles.metricRow}>
                    <View style={[styles.metricDot, { backgroundColor: '#D4956A' }]} />
                    <Text style={styles.metricName} numberOfLines={1}>{signal}</Text>
                    <View style={[styles.metricBadge, { backgroundColor: '#FFF5EB' }]}>
                      <Text style={[styles.metricCount, { color: '#D4956A' }]}>{count}</Text>
                    </View>
                  </View>
                ))
              )}
              <View style={styles.premiumInsight}>
                <Clock size={12} color={Colors.textSecondary} />
                <Text style={styles.premiumInsightText}>
                  Track upgrade_screen_viewed, premium_feature_attempted, and upgrade_clicked to measure conversion funnel.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  statPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statPillText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  tabBar: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  actionBar: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionBtnDanger: {
    borderColor: Colors.dangerLight,
    backgroundColor: '#FFF8F6',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  actionBtnTextDanger: {
    color: Colors.danger,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center' as const,
  },
  eventList: {
    gap: 2,
  },
  eventRow: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 4,
    overflow: 'hidden' as const,
  },
  eventRowHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 11,
    gap: 10,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventRowContent: {
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  eventName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  eventTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  eventProperties: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 4,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  propertyRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 3,
  },
  propertyKey: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  propertyValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600' as const,
    maxWidth: '60%' as const,
    textAlign: 'right' as const,
  },
  eventTimestamp: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'right' as const,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  noData: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  metricRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricName: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  metricBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metricCount: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  flowRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  flowInfo: {
    marginBottom: 8,
  },
  flowName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  flowStats: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  flowRateContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  flowRateBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  flowRateFill: {
    height: '100%' as const,
    borderRadius: 3,
  },
  flowRateGood: {
    backgroundColor: Colors.success,
  },
  flowRateOk: {
    backgroundColor: '#F59E0B',
  },
  flowRateLow: {
    backgroundColor: Colors.danger,
  },
  flowRateText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    width: 36,
    textAlign: 'right' as const,
  },
  premiumHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 0,
  },
  premiumInsight: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  premiumInsightText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  bottomSpacer: {
    height: 30,
  },
  contextRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  contextLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    flex: 1,
    marginRight: 8,
  },
  contextValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'right' as const,
    maxWidth: '50%' as const,
  },
  contextBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contextBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  contextDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

function getZoneColor(zone: string): string {
  switch (zone) {
    case 'crisis': return Colors.danger;
    case 'relationship_distress': return '#E84393';
    case 'activated': return '#E17055';
    case 'recovering': return Colors.success;
    case 'calm': return Colors.primary;
    default: return Colors.textMuted;
  }
}
