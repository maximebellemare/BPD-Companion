import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock,
  Flame,
  Heart,
  Shield,
  AlertTriangle,
  CheckCircle,
  Users,
  MessageSquare,
  Filter,
  X,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTimeline } from '@/hooks/useTimeline';
import { TimelineEvent, TimelineMarker } from '@/types/timeline';

const MARKER_CONFIG: Record<
  TimelineMarker,
  { color: string; bg: string; label: string; icon: React.ElementType }
> = {
  high_distress: {
    color: Colors.danger,
    bg: Colors.dangerLight,
    label: 'High Distress',
    icon: Flame,
  },
  coping_success: {
    color: Colors.success,
    bg: Colors.successLight,
    label: 'Coping Success',
    icon: CheckCircle,
  },
  relationship_conflict: {
    color: '#E67E22',
    bg: '#FEF5E7',
    label: 'Conflict',
    icon: Users,
  },
  low_distress: {
    color: Colors.primary,
    bg: Colors.primaryLight,
    label: 'Calm',
    icon: Heart,
  },
  none: {
    color: Colors.textMuted,
    bg: Colors.surface,
    label: '',
    icon: Clock,
  },
};

const DATE_RANGES = [
  { key: 'week' as const, label: '7 days' },
  { key: 'month' as const, label: '30 days' },
  { key: 'all' as const, label: 'All time' },
];

function formatEventDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatEventTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function groupEventsByDate(
  events: TimelineEvent[]
): { date: string; timestamp: number; events: TimelineEvent[] }[] {
  const groups: Record<string, TimelineEvent[]> = {};
  events.forEach((event) => {
    const key = new Date(event.timestamp).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  });
  return Object.entries(groups)
    .map(([_dateKey, evts]) => ({
      date: formatEventDate(evts[0].timestamp),
      timestamp: evts[0].timestamp,
      events: evts,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

const TimelineEventCard = React.memo(function TimelineEventCard({
  event,
  isLast,
}: {
  event: TimelineEvent;
  isLast: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const marker = MARKER_CONFIG[event.marker];
  const MarkerIcon = marker.icon;

  const intensityColor =
    event.intensity !== undefined
      ? event.intensity <= 3
        ? Colors.success
        : event.intensity <= 6
        ? Colors.accent
        : Colors.danger
      : Colors.textMuted;

  return (
    <Animated.View style={[styles.eventRow, { opacity: fadeAnim }]}>
      <View style={styles.timelineTrack}>
        <View style={[styles.timelineDot, { backgroundColor: marker.color }]}>
          <MarkerIcon size={12} color={Colors.white} />
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      <View style={[styles.eventCard, { borderLeftColor: marker.color }]}>
        <View style={styles.eventCardHeader}>
          <View style={styles.eventTypeRow}>
            {event.type === 'message_draft' ? (
              <MessageSquare size={14} color={Colors.textSecondary} />
            ) : event.type === 'journal' ? (
              <Clock size={14} color={Colors.textSecondary} />
            ) : null}
            <Text style={styles.eventTime}>{formatEventTime(event.timestamp)}</Text>
            {event.marker !== 'none' && (
              <View style={[styles.markerBadge, { backgroundColor: marker.bg }]}>
                <Text style={[styles.markerBadgeText, { color: marker.color }]}>
                  {marker.label}
                </Text>
              </View>
            )}
          </View>
          {event.intensity !== undefined && (
            <View style={[styles.intensityPill, { backgroundColor: intensityColor + '18' }]}>
              <Text style={[styles.intensityPillText, { color: intensityColor }]}>
                {event.intensity}/10
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>

        {event.description !== 'No notes' && (
          <Text style={styles.eventDescription} numberOfLines={3}>
            {event.description}
          </Text>
        )}

        {event.emotions.length > 0 && (
          <View style={styles.tagRow}>
            {event.emotions.slice(0, 4).map((emotion) => (
              <View key={emotion} style={styles.emotionChip}>
                <Text style={styles.emotionChipText}>{emotion}</Text>
              </View>
            ))}
            {event.emotions.length > 4 && (
              <Text style={styles.moreChipText}>+{event.emotions.length - 4}</Text>
            )}
          </View>
        )}

        {event.triggers.length > 0 && (
          <View style={styles.tagRow}>
            {event.triggers.slice(0, 3).map((trigger) => (
              <View key={trigger} style={styles.triggerChip}>
                <AlertTriangle size={10} color={Colors.accent} />
                <Text style={styles.triggerChipText}>{trigger}</Text>
              </View>
            ))}
          </View>
        )}

        {event.copingUsed.length > 0 && (
          <View style={styles.tagRow}>
            {event.copingUsed.slice(0, 3).map((coping) => (
              <View key={coping} style={styles.copingChip}>
                <Shield size={10} color={Colors.success} />
                <Text style={styles.copingChipText}>{coping}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
});

function StatsBar({
  stats,
}: {
  stats: {
    totalEvents: number;
    avgIntensity: number;
    highDistressCount: number;
    copingSuccessCount: number;
    conflictCount: number;
  };
}) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.totalEvents}</Text>
        <Text style={styles.statLabel}>Events</Text>
      </View>
      <View style={[styles.statDivider]} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: Colors.danger }]}>
          {stats.highDistressCount}
        </Text>
        <Text style={styles.statLabel}>High Distress</Text>
      </View>
      <View style={[styles.statDivider]} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: Colors.success }]}>
          {stats.copingSuccessCount}
        </Text>
        <Text style={styles.statLabel}>Coped Well</Text>
      </View>
      <View style={[styles.statDivider]} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: '#E67E22' }]}>
          {stats.conflictCount}
        </Text>
        <Text style={styles.statLabel}>Conflicts</Text>
      </View>
    </View>
  );
}

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const {
    events,
    stats,
    filters,
    updateFilter,
    resetFilters,
    uniqueEmotions,
    uniqueTriggerCategories,
  } = useTimeline();
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);

  const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);

  const hasActiveFilters =
    filters.emotionType !== null ||
    filters.triggerType !== null ||
    filters.markerFilter !== null ||
    filters.dateRange !== 'month';

  const handleEmotionFilter = useCallback(
    (emotion: string | null) => {
      updateFilter('emotionType', emotion === filters.emotionType ? null : emotion);
    },
    [updateFilter, filters.emotionType]
  );

  const handleTriggerFilter = useCallback(
    (trigger: string | null) => {
      updateFilter('triggerType', trigger === filters.triggerType ? null : trigger);
    },
    [updateFilter, filters.triggerType]
  );

  const handleMarkerFilter = useCallback(
    (marker: TimelineMarker | null) => {
      updateFilter('markerFilter', marker === filters.markerFilter ? null : marker);
    },
    [updateFilter, filters.markerFilter]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Emotional Timeline',
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: {
            color: Colors.text,
            fontWeight: '700' as const,
            fontSize: 18,
          },
          headerShadowVisible: false,
          headerTintColor: Colors.primary,
        }}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <StatsBar stats={stats} />

        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            {DATE_RANGES.map((range) => (
              <TouchableOpacity
                key={range.key}
                style={[
                  styles.filterChip,
                  filters.dateRange === range.key && styles.filterChipActive,
                ]}
                onPress={() => updateFilter('dateRange', range.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.dateRange === range.key && styles.filterChipTextActive,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.filterChip,
                styles.filterChipOutline,
                hasActiveFilters && styles.filterChipActive,
              ]}
              onPress={() => setFilterModalVisible(true)}
            >
              <Filter
                size={14}
                color={hasActiveFilters ? Colors.white : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  hasActiveFilters && styles.filterChipTextActive,
                ]}
              >
                Filters
              </Text>
            </TouchableOpacity>

            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearBtn} onPress={resetFilters}>
                <X size={14} color={Colors.danger} />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {filters.emotionType && (
          <View style={styles.activeFilterRow}>
            <Text style={styles.activeFilterLabel}>Emotion:</Text>
            <View style={styles.activeFilterValue}>
              <Text style={styles.activeFilterValueText}>{filters.emotionType}</Text>
              <TouchableOpacity onPress={() => updateFilter('emotionType', null)}>
                <X size={12} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {filters.triggerType && (
          <View style={styles.activeFilterRow}>
            <Text style={styles.activeFilterLabel}>Trigger:</Text>
            <View style={styles.activeFilterValue}>
              <Text style={styles.activeFilterValueText}>{filters.triggerType}</Text>
              <TouchableOpacity onPress={() => updateFilter('triggerType', null)}>
                <X size={12} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptyDesc}>
              {hasActiveFilters
                ? 'Try adjusting your filters to see more events.'
                : 'Your emotional timeline will build as you use the app.'}
            </Text>
          </View>
        ) : (
          groupedEvents.map((group) => (
            <View key={group.date} style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <View style={styles.dateLine} />
                <Text style={styles.dateLabel}>{group.date}</Text>
                <View style={styles.dateLine} />
              </View>
              {group.events.map((event, idx) => (
                <TimelineEventCard
                  key={event.id}
                  event={event}
                  isLast={idx === group.events.length - 1}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filter Timeline</Text>

            <Text style={styles.modalSectionTitle}>Event Markers</Text>
            <View style={styles.modalChipRow}>
              {(
                [
                  'high_distress',
                  'coping_success',
                  'relationship_conflict',
                  'low_distress',
                ] as TimelineMarker[]
              ).map((m) => {
                const cfg = MARKER_CONFIG[m];
                const isActive = filters.markerFilter === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modalChip,
                      { borderColor: cfg.color },
                      isActive && { backgroundColor: cfg.bg },
                    ]}
                    onPress={() => handleMarkerFilter(m)}
                  >
                    <Text
                      style={[styles.modalChipText, { color: cfg.color }]}
                    >
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {uniqueEmotions.length > 0 && (
              <>
                <Text style={styles.modalSectionTitle}>Emotions</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.modalScrollRow}
                >
                  {uniqueEmotions.map((emotion) => (
                    <TouchableOpacity
                      key={emotion}
                      style={[
                        styles.modalChip,
                        { borderColor: Colors.primary },
                        filters.emotionType === emotion && {
                          backgroundColor: Colors.primaryLight,
                        },
                      ]}
                      onPress={() => handleEmotionFilter(emotion)}
                    >
                      <Text
                        style={[styles.modalChipText, { color: Colors.primary }]}
                      >
                        {emotion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {uniqueTriggerCategories.length > 0 && (
              <>
                <Text style={styles.modalSectionTitle}>Trigger Types</Text>
                <View style={styles.modalChipRow}>
                  {uniqueTriggerCategories.map((tc) => (
                    <TouchableOpacity
                      key={tc}
                      style={[
                        styles.modalChip,
                        { borderColor: Colors.accent },
                        filters.triggerType === tc && {
                          backgroundColor: Colors.accentLight,
                        },
                      ]}
                      onPress={() => handleTriggerFilter(tc)}
                    >
                      <Text
                        style={[styles.modalChipText, { color: Colors.accent }]}
                      >
                        {tc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  filterBar: {
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipOutline: {
    borderStyle: 'dashed' as const,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearBtnText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600' as const,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeFilterLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  activeFilterValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeFilterValueText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  dateGroup: {
    marginBottom: 8,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  eventRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineTrack: {
    width: 32,
    alignItems: 'center',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderLight,
    marginTop: 4,
  },
  eventCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginLeft: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  markerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  markerBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  intensityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  intensityPillText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  eventDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
  },
  emotionChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  emotionChipText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  moreChipText: {
    fontSize: 11,
    color: Colors.textMuted,
    alignSelf: 'center',
  },
  triggerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  triggerChipText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  copingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  copingChipText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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
    textAlign: 'center' as const,
    marginTop: 8,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 16,
  },
  modalChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalScrollRow: {
    maxHeight: 40,
  },
  modalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  modalChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  modalDoneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  modalDoneBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
