import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  Plus,
  PenLine,
  BarChart3,
  Star,
  Sparkles,
  BookOpen,
  Flame,
  Brain,
  AlertTriangle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { useJournal } from '@/providers/JournalProvider';
import { JournalEntry } from '@/types';
import { SmartJournalEntry, FORMAT_CONFIG, JournalEntryFormat } from '@/types/journalEntry';
import { AIJournalMode } from '@/types/journalDaily';
import { GUIDED_REFLECTION_FLOWS } from '@/data/guidedReflectionFlows';
import { MessageSquare } from 'lucide-react-native';
import { buildCrossLoopContext } from '@/services/crossLoop/crossLoopBridgeService';
import { useQuery } from '@tanstack/react-query';
import { getEnhancedOutcomes } from '@/services/messages/enhancedOutcomeService';
import { trackEvent } from '@/services/analytics/analyticsService';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function CheckInEntryCard({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const intensityColor =
    entry.checkIn.intensityLevel <= 3 ? Colors.success
    : entry.checkIn.intensityLevel <= 6 ? Colors.accent
    : Colors.danger;

  return (
    <TouchableOpacity style={styles.entryCard} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
      <View style={styles.entryHeader}>
        <View style={styles.entryLeft}>
          <View style={[styles.intensityBadge, { backgroundColor: intensityColor }]}>
            <Text style={styles.intensityBadgeText}>{entry.checkIn.intensityLevel}</Text>
          </View>
          <View>
            <Text style={styles.entryTime}>{formatDate(entry.timestamp)}</Text>
            <Text style={styles.entryTimeDetail}>{formatTime(entry.timestamp)}</Text>
          </View>
        </View>
        <View style={styles.entryRight}>
          <View style={styles.checkInBadge}>
            <Text style={styles.checkInBadgeText}>Check-in</Text>
          </View>
          {expanded ? <ChevronUp size={18} color={Colors.textMuted} /> : <ChevronDown size={18} color={Colors.textMuted} />}
        </View>
      </View>
      <View style={styles.entryEmotions}>
        {entry.checkIn.emotions.slice(0, 4).map(e => (
          <View key={e.id} style={styles.emotionTag}>
            <Text style={styles.emotionEmoji}>{e.emoji}</Text>
            <Text style={styles.emotionLabel}>{e.label}</Text>
          </View>
        ))}
        {entry.checkIn.emotions.length > 4 && (
          <Text style={styles.moreText}>+{entry.checkIn.emotions.length - 4}</Text>
        )}
      </View>
      {expanded && (
        <View style={styles.entryDetails}>
          {entry.checkIn.triggers.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Triggers</Text>
              <Text style={styles.detailText}>{entry.checkIn.triggers.map(t => t.label).join(', ')}</Text>
            </View>
          )}
          {entry.checkIn.urges.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Urges</Text>
              <Text style={styles.detailText}>{entry.checkIn.urges.map(u => u.label).join(', ')}</Text>
            </View>
          )}
          {entry.checkIn.notes ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailText}>{entry.checkIn.notes}</Text>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const SmartEntryCard = React.memo(function SmartEntryCard({
  entry,
  onPress,
}: {
  entry: SmartJournalEntry;
  onPress: (id: string) => void;
}) {
  const config = FORMAT_CONFIG[entry.format];
  const distressColor = entry.distressLevel <= 3 ? Colors.success : entry.distressLevel <= 6 ? Colors.accent : Colors.danger;

  return (
    <TouchableOpacity style={styles.smartEntryCard} onPress={() => onPress(entry.id)} activeOpacity={0.8}>
      <View style={styles.smartEntryHeader}>
        <View style={styles.smartEntryLeft}>
          <View style={[styles.formatBadge, { backgroundColor: distressColor + '18' }]}>
            <Text style={styles.formatEmoji}>{config.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.smartEntryTitle} numberOfLines={1}>{entry.title || config.label}</Text>
            <Text style={styles.smartEntryTime}>{formatDate(entry.timestamp)}</Text>
          </View>
        </View>
        <View style={styles.smartEntryMeta}>
          {entry.isImportant && <Star size={14} color={Colors.brandAmber} fill={Colors.brandAmber} />}
          {entry.aiInsight && <Sparkles size={14} color={Colors.brandLilac} />}
          <View style={[styles.distressPill, { backgroundColor: distressColor + '18' }]}>
            <Text style={[styles.distressPillText, { color: distressColor }]}>{entry.distressLevel}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.smartEntryPreview} numberOfLines={2}>{entry.content}</Text>
      {entry.emotions.length > 0 && (
        <View style={styles.entryEmotions}>
          {entry.emotions.slice(0, 3).map(e => (
            <View key={e.id} style={styles.emotionTag}>
              <Text style={styles.emotionEmoji}>{e.emoji}</Text>
              <Text style={styles.emotionLabel}>{e.label}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
});

const WRITE_FORMATS: { format: JournalEntryFormat; emoji: string; label: string }[] = [
  { format: 'free_writing', emoji: '✍️', label: 'Free Write' },
  { format: 'emotional_event', emoji: '🌊', label: 'Emotional Event' },
  { format: 'relationship_conflict', emoji: '💬', label: 'Conflict' },
  { format: 'letter_not_sent', emoji: '📨', label: 'Letter Not Sent' },
  { format: 'letter_to_future_self', emoji: '🕊️', label: 'Future Self' },
  { format: 'gratitude', emoji: '🙏', label: 'Gratitude' },
  { format: 'breakthrough_insight', emoji: '💡', label: 'Breakthrough' },
];

const AI_MODES: { mode: AIJournalMode; emoji: string; label: string }[] = [
  { mode: 'free_reflection', emoji: '🪞', label: 'Free Reflection' },
  { mode: 'emotional_event', emoji: '🌊', label: 'Process Event' },
  { mode: 'relationship_conflict', emoji: '💬', label: 'Relationship' },
  { mode: 'shame_recovery', emoji: '🫂', label: 'Shame Recovery' },
  { mode: 'therapy_prep', emoji: '📋', label: 'Therapy Prep' },
  { mode: 'breakthrough', emoji: '💡', label: 'Insight' },
];

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { journalEntries } = useApp();
  const {
    smartEntries,
    stats,
    todayReflections,
    reflectionStreak,
    predictions,
    weeklyReport,
  } = useJournal();
  const [showWriteOptions, setShowWriteOptions] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'journal' | 'checkins'>('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const messageOutcomesQuery = useQuery({
    queryKey: ['journal-message-outcomes'],
    queryFn: getEnhancedOutcomes,
    staleTime: 120000,
  });

  const crossLoopContext = useMemo(() => {
    return buildCrossLoopContext(
      smartEntries,
      journalEntries,
      messageOutcomesQuery.data ?? [],
      [],
    );
  }, [smartEntries, journalEntries, messageOutcomesQuery.data]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    void trackEvent('screen_view', { screen: 'journal' });
  }, [fadeAnim]);

  const hasAnyEntries = journalEntries.length > 0 || smartEntries.length > 0;
  const currentHour = new Date().getHours();
  const isMorningTime = currentHour >= 5 && currentHour < 12;
  const isEveningTime = currentHour >= 17 || currentHour < 5;

  const handleSmartEntryPress = useCallback((id: string) => {
    router.push(`/journal-entry-detail?id=${id}` as never);
  }, [router]);

  const handleWriteFormat = useCallback((format: JournalEntryFormat) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowWriteOptions(false);
    router.push(`/journal-write?format=${format}` as never);
  }, [router]);

  const handleGuidedFlow = useCallback((flowId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/journal-guided?flowId=${flowId}` as never);
  }, [router]);

  const handleAIMode = useCallback((mode: AIJournalMode) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/journal-ai-therapist?mode=${mode}` as never);
  }, [router]);

  const allEntries = useMemo(() => {
    type MergedEntry = { type: 'checkin'; data: JournalEntry; timestamp: number } | { type: 'smart'; data: SmartJournalEntry; timestamp: number };
    const merged: MergedEntry[] = [];
    if (activeTab === 'all' || activeTab === 'checkins') {
      journalEntries.forEach(e => merged.push({ type: 'checkin', data: e, timestamp: e.timestamp }));
    }
    if (activeTab === 'all' || activeTab === 'journal') {
      smartEntries.forEach(e => merged.push({ type: 'smart', data: e, timestamp: e.timestamp }));
    }
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  }, [journalEntries, smartEntries, activeTab]);

  const freeFlows = GUIDED_REFLECTION_FLOWS.filter(f => !f.isPremium);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Journal</Text>
            <Text style={styles.subtitle}>Your private reflection space</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/journal/timeline')}>
              <Clock size={18} color={Colors.brandTeal} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/journal-insights' as never)}>
              <BarChart3 size={18} color={Colors.brandTeal} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {(isMorningTime && !todayReflections.morning) || (isEveningTime && !todayReflections.evening) ? (
            <TouchableOpacity
              style={[
                styles.dailyCard,
                { backgroundColor: isMorningTime && !todayReflections.morning ? '#FFF8EE' : '#EEEDF7' },
              ]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const type = isMorningTime && !todayReflections.morning ? 'morning' : 'evening';
                router.push(`/journal-daily?type=${type}` as never);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.dailyCardInner}>
                <View style={[
                  styles.dailyIconCircle,
                  { backgroundColor: isMorningTime && !todayReflections.morning ? '#FFEFC8' : '#D8D5ED' },
                ]}>
                  {isMorningTime && !todayReflections.morning ? (
                    <Sun size={22} color="#D49A20" />
                  ) : (
                    <Moon size={22} color="#6B64A0" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dailyCardTitle}>
                    {isMorningTime && !todayReflections.morning ? 'Morning Check-In' : 'Evening Reflection'}
                  </Text>
                  <Text style={styles.dailyCardDesc}>
                    {isMorningTime && !todayReflections.morning
                      ? 'Set your emotional intention for today'
                      : 'Reflect on what stood out emotionally'}
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.textMuted} />
              </View>
              {reflectionStreak.currentStreak > 0 && (
                <View style={styles.streakRow}>
                  <Flame size={13} color="#E8A838" />
                  <Text style={styles.streakText}>
                    {reflectionStreak.currentStreak} day streak
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            todayReflections.morning && todayReflections.evening && (
              <View style={styles.dailyCompletedCard}>
                <View style={styles.dailyCompletedInner}>
                  <View style={styles.dailyCompletedIcon}>
                    <Flame size={16} color="#E8A838" />
                  </View>
                  <Text style={styles.dailyCompletedText}>
                    Today's reflections complete
                    {reflectionStreak.currentStreak > 1 ? ` · ${reflectionStreak.currentStreak} day streak` : ''}
                  </Text>
                </View>
              </View>
            )
          )}

          {stats.totalEntries > 0 && (
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{reflectionStreak.currentStreak || stats.streakDays}</Text>
                <Text style={styles.statLabel}>streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.thisWeekEntries}</Text>
                <Text style={styles.statLabel}>this week</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalEntries + journalEntries.length}</Text>
                <Text style={styles.statLabel}>total</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.aiTherapistCard}
            onPress={() => handleAIMode('free_reflection')}
            activeOpacity={0.85}
          >
            <View style={styles.aiTherapistHeader}>
              <View style={styles.aiTherapistIconCircle}>
                <Brain size={20} color={Colors.brandLilac} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.aiTherapistTitleRow}>
                  <Text style={styles.aiTherapistTitle}>AI Journal Guide</Text>
                  <View style={styles.premiumBadge}>
                    <Sparkles size={10} color={Colors.brandLilac} />
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </View>
                </View>
                <Text style={styles.aiTherapistDesc}>
                  Write with AI-guided reflection — like therapy for your thoughts
                </Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.aiModesScroll}>
              <View style={styles.aiModesRow}>
                {AI_MODES.map(item => (
                  <TouchableOpacity
                    key={item.mode}
                    style={styles.aiModeChip}
                    onPress={() => handleAIMode(item.mode)}
                  >
                    <Text style={styles.aiModeEmoji}>{item.emoji}</Text>
                    <Text style={styles.aiModeLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </TouchableOpacity>

          {crossLoopContext.journalToMessageSuggestion && (
            <TouchableOpacity
              style={styles.crossLoopBanner}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/messages' as never);
              }}
              activeOpacity={0.8}
              testID="cross-loop-message-banner"
            >
              <View style={styles.crossLoopIconWrap}>
                <MessageSquare size={16} color="#5B8FB9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.crossLoopText}>{crossLoopContext.journalToMessageSuggestion}</Text>
              </View>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          {crossLoopContext.messageToJournalPrompt && (
            <TouchableOpacity
              style={styles.crossLoopBanner}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleWriteFormat('emotional_event');
              }}
              activeOpacity={0.8}
              testID="cross-loop-journal-banner"
            >
              <View style={[styles.crossLoopIconWrap, { backgroundColor: Colors.brandLilacSoft }]}>
                <PenLine size={16} color={Colors.brandLilac} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.crossLoopText}>{crossLoopContext.messageToJournalPrompt}</Text>
              </View>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          {predictions.length > 0 && (
            <View style={styles.predictionsSection}>
              <View style={styles.sectionTitleRow}>
                <AlertTriangle size={15} color={Colors.accent} />
                <Text style={styles.sectionTitle}>Pattern Insight</Text>
              </View>
              {predictions.slice(0, 2).map(prediction => (
                <TouchableOpacity
                  key={prediction.id}
                  style={styles.predictionCard}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const route = prediction.suggestedAction.route;
                    const params = prediction.suggestedAction.params;
                    const query = params ? '?' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&') : '';
                    router.push(`${route}${query}` as never);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.predictionTitle}>{prediction.title}</Text>
                  <Text style={styles.predictionDesc}>{prediction.description}</Text>
                  <View style={styles.predictionAction}>
                    <Text style={styles.predictionActionText}>{prediction.suggestedAction.label}</Text>
                    <ChevronRight size={14} color={Colors.brandTeal} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {weeklyReport && (
            <TouchableOpacity
              style={styles.weeklyCard}
              onPress={() => router.push('/journal-weekly-report' as never)}
              activeOpacity={0.85}
            >
              <View style={styles.weeklyHeader}>
                <BookOpen size={16} color={Colors.brandTeal} />
                <Text style={styles.weeklyTitle}>Weekly Reflection</Text>
              </View>
              <Text style={styles.weeklyPreview} numberOfLines={2}>
                {weeklyReport.reflectionLetter}
              </Text>
              <Text style={styles.weeklyLink}>Read full report →</Text>
            </TouchableOpacity>
          )}

          {showWriteOptions && (
            <View style={styles.writeOptionsCard}>
              <Text style={styles.writeOptionsTitle}>What would you like to write?</Text>
              <View style={styles.writeGrid}>
                {WRITE_FORMATS.map(item => (
                  <TouchableOpacity
                    key={item.format}
                    style={styles.writeOption}
                    onPress={() => handleWriteFormat(item.format)}
                  >
                    <Text style={styles.writeOptionEmoji}>{item.emoji}</Text>
                    <Text style={styles.writeOptionLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.guidedTitle}>Guided Reflections</Text>
              {freeFlows.slice(0, 4).map(flow => (
                <TouchableOpacity
                  key={flow.id}
                  style={styles.guidedRow}
                  onPress={() => handleGuidedFlow(flow.id)}
                >
                  <Text style={styles.guidedEmoji}>{flow.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guidedName}>{flow.title}</Text>
                    <Text style={styles.guidedDesc} numberOfLines={1}>{flow.description}</Text>
                  </View>
                  <Text style={styles.guidedTime}>{flow.estimatedMinutes} min</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {hasAnyEntries && (
            <View style={styles.entriesSection}>
              <Text style={styles.entriesSectionTitle}>Recent Entries</Text>
              <View style={styles.tabRow}>
                {(['all', 'journal', 'checkins'] as const).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.tabActive]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                      {tab === 'all' ? 'All' : tab === 'journal' ? 'Journal' : 'Check-ins'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {!hasAnyEntries && !showWriteOptions ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <PenLine size={28} color={Colors.brandTeal} />
              </View>
              <Text style={styles.emptyTitle}>Your journal is ready</Text>
              <Text style={styles.emptyDesc}>
                This is your private space to reflect.{'\n'}Write freely, follow guided prompts, or just check in.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => setShowWriteOptions(true)}
              >
                <PenLine size={16} color={Colors.white} />
                <Text style={styles.emptyBtnText}>Start writing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            allEntries.slice(0, 20).map(item => {
              if (item.type === 'checkin') {
                return <CheckInEntryCard key={`ci_${item.data.id}`} entry={item.data as JournalEntry} />;
              }
              return (
                <SmartEntryCard
                  key={`sj_${item.data.id}`}
                  entry={item.data as SmartJournalEntry}
                  onPress={handleSmartEntryPress}
                />
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 16 }]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowWriteOptions(!showWriteOptions);
          }}
          activeOpacity={0.85}
        >
          {showWriteOptions ? (
            <ChevronDown size={24} color={Colors.white} />
          ) : (
            <Plus size={24} color={Colors.white} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 4,
  },
  dailyCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  dailyCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dailyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  dailyCardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#C08020',
  },
  dailyCompletedCard: {
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  dailyCompletedInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyCompletedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyCompletedText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: 'rgba(27,40,56,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  aiTherapistCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.brandLilac + '18',
    shadowColor: 'rgba(27,40,56,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  aiTherapistHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  aiTherapistIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.brandLilacSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTherapistTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTherapistTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.brandLilacSoft,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.brandLilac,
    textTransform: 'uppercase' as const,
  },
  aiTherapistDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  aiModesScroll: {
    marginLeft: -4,
  },
  aiModesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 12,
  },
  aiModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.brandLilacSoft,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  aiModeEmoji: {
    fontSize: 13,
  },
  aiModeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.brandLilac,
  },
  predictionsSection: {
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  predictionCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  predictionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  predictionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  predictionActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  weeklyCard: {
    backgroundColor: Colors.brandTealSoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.brandTeal + '20',
  },
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.brandTeal,
  },
  weeklyPreview: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  weeklyLink: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  writeOptionsCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: 'rgba(27,40,56,0.06)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  writeOptionsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  writeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  writeOption: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minWidth: 80,
    flex: 1,
  },
  writeOptionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  writeOptionLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  guidedTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  guidedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  guidedEmoji: {
    fontSize: 20,
  },
  guidedName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  guidedDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  guidedTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  entriesSection: {
    marginBottom: 10,
  },
  entriesSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.brandTeal,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  entryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: 'rgba(27,40,56,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkInBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  checkInBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
  },
  intensityBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityBadgeText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  entryTime: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  entryTimeDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  entryEmotions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  emotionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  emotionEmoji: {
    fontSize: 13,
  },
  emotionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  moreText: {
    fontSize: 12,
    color: Colors.textMuted,
    alignSelf: 'center',
  },
  entryDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
  },
  detailSection: {},
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  smartEntryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: 'rgba(27,40,56,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  smartEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  smartEntryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  formatBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatEmoji: {
    fontSize: 16,
  },
  smartEntryTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  smartEntryTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  smartEntryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distressPill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distressPillText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  smartEntryPreview: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.brandTeal,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.brandTeal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brandTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  crossLoopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F6FA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(91, 143, 185, 0.15)',
  },
  crossLoopIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E3EFF7',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  crossLoopText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
