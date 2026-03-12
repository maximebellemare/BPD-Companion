import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { JournalEntry } from '@/types';

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

function PatternSection({ title, data }: { title: string; data: Record<string, number> }) {
  const sorted = useMemo(
    () => Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5),
    [data]
  );
  const max = sorted.length > 0 ? sorted[0][1] : 1;

  if (sorted.length === 0) return null;

  return (
    <View style={styles.patternSection}>
      <Text style={styles.patternTitle}>{title}</Text>
      {sorted.map(([label, count]) => (
        <View key={label} style={styles.patternRow}>
          <Text style={styles.patternLabel} numberOfLines={1}>{label}</Text>
          <View style={styles.patternBarBg}>
            <View
              style={[
                styles.patternBarFill,
                { width: `${(count / max) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.patternCount}>{count}</Text>
        </View>
      ))}
    </View>
  );
}

function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const intensityColor =
    entry.checkIn.intensityLevel <= 3
      ? Colors.success
      : entry.checkIn.intensityLevel <= 6
      ? Colors.accent
      : Colors.danger;

  return (
    <TouchableOpacity style={styles.entryCard} onPress={toggle} activeOpacity={0.8}>
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
        {expanded ? (
          <ChevronUp size={18} color={Colors.textMuted} />
        ) : (
          <ChevronDown size={18} color={Colors.textMuted} />
        )}
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
              <Text style={styles.detailText}>
                {entry.checkIn.triggers.map(t => t.label).join(', ')}
              </Text>
            </View>
          )}
          {entry.checkIn.urges.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Urges</Text>
              <Text style={styles.detailText}>
                {entry.checkIn.urges.map(u => u.label).join(', ')}
              </Text>
            </View>
          )}
          {entry.checkIn.bodySensations.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Body sensations</Text>
              <Text style={styles.detailText}>
                {entry.checkIn.bodySensations.map(b => b.label).join(', ')}
              </Text>
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

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { journalEntries, triggerPatterns } = useApp();
  const [showPatterns, setShowPatterns] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const hasPatterns =
    Object.keys(triggerPatterns.triggerCounts).length > 0 ||
    Object.keys(triggerPatterns.emotionCounts).length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <Text style={styles.title}>Journal</Text>
          {hasPatterns && (
            <TouchableOpacity
              style={[styles.patternToggle, showPatterns && styles.patternToggleActive]}
              onPress={() => setShowPatterns(!showPatterns)}
            >
              <TrendingUp size={16} color={showPatterns ? Colors.white : Colors.primary} />
              <Text
                style={[
                  styles.patternToggleText,
                  showPatterns && styles.patternToggleTextActive,
                ]}
              >
                Patterns
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {showPatterns && hasPatterns && (
            <View style={styles.patternsCard}>
              <Text style={styles.patternsTitle}>Your patterns</Text>
              <Text style={styles.patternsSubtitle}>
                Based on {journalEntries.length} check-in{journalEntries.length !== 1 ? 's' : ''}
              </Text>
              <PatternSection title="Top triggers" data={triggerPatterns.triggerCounts} />
              <PatternSection title="Most felt emotions" data={triggerPatterns.emotionCounts} />
              <PatternSection title="Common urges" data={triggerPatterns.urgeCounts} />
            </View>
          )}

          {journalEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyDesc}>
                Your check-ins will appear here.{'\n'}Each one helps you understand yourself better.
              </Text>
            </View>
          ) : (
            journalEntries.map(entry => (
              <JournalEntryCard key={entry.id} entry={entry} />
            ))
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  patternToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  patternToggleActive: {
    backgroundColor: Colors.primary,
  },
  patternToggleText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  patternToggleTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  patternsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  patternsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  patternsSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  patternSection: {
    marginTop: 12,
  },
  patternTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  patternLabel: {
    fontSize: 13,
    color: Colors.text,
    width: 120,
  },
  patternBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  patternBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  patternCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    width: 24,
    textAlign: 'right' as const,
  },
  entryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
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
    marginTop: 12,
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
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
