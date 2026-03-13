import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Brain,
  Heart,
  Zap,
  Shield,
  Users,
  Lightbulb,
  Trash2,
  Pencil,
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { EpisodicMemory, SemanticMemory, SessionSummary } from '@/types/companionMemory';
import { trackEvent } from '@/services/analytics/analyticsService';

type MemoryTab = 'events' | 'insights' | 'relationships' | 'growth';

interface ExpandedMemory {
  id: string;
  editing: boolean;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getEmotionColor(emotion: string): string {
  const lower = emotion.toLowerCase();
  if (lower.includes('anger') || lower.includes('rage')) return '#E17055';
  if (lower.includes('sad') || lower.includes('grief')) return '#6C8EBF';
  if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('fear')) return '#D4956A';
  if (lower.includes('shame') || lower.includes('guilt')) return '#9B8EC4';
  if (lower.includes('joy') || lower.includes('happy')) return '#00B894';
  if (lower.includes('calm') || lower.includes('peace')) return '#6B9080';
  if (lower.includes('overwhelm') || lower.includes('panic')) return '#E74C3C';
  if (lower.includes('empty') || lower.includes('numb')) return '#A8B0B5';
  return Colors.primary;
}

export default function EmotionalMemoriesScreen() {
  const router = useRouter();
  const { companionMemoryStore, deleteMemory, editMemoryLesson } = useAICompanion();

  const [activeTab, setActiveTab] = useState<MemoryTab>('events');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedMemory, setExpandedMemory] = useState<ExpandedMemory | null>(null);
  const [editText, setEditText] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    void trackEvent('emotional_memories_viewed');
  }, []);

  const episodicMemories = useMemo(() => {
    if (!companionMemoryStore) return [];
    return [...companionMemoryStore.episodicMemories].sort((a, b) => b.timestamp - a.timestamp);
  }, [companionMemoryStore]);

  const semanticMemories = useMemo(() => {
    if (!companionMemoryStore) return [];
    return [...companionMemoryStore.semanticMemories].sort((a, b) => b.observationCount - a.observationCount);
  }, [companionMemoryStore]);

  const sessionSummaries = useMemo(() => {
    if (!companionMemoryStore) return [];
    return [...companionMemoryStore.sessionSummaries].sort((a, b) => b.timestamp - a.timestamp);
  }, [companionMemoryStore]);

  const relationshipMemories = useMemo(() => {
    return episodicMemories.filter(m => m.relationshipContext);
  }, [episodicMemories]);

  const growthMemories = useMemo(() => {
    const growthTraits = semanticMemories.filter(m =>
      m.tags.some(t => t === 'growth' || t === 'insight' || t === 'self-awareness' || t === 'skill'),
    );
    const managedEpisodes = episodicMemories.filter(m =>
      m.outcome === 'managed' || m.outcome === 'helped' || m.outcome === 'gained insight',
    );
    return { traits: growthTraits, episodes: managedEpisodes };
  }, [semanticMemories, episodicMemories]);

  const filteredEpisodic = useMemo(() => {
    if (!searchQuery.trim()) return episodicMemories;
    const q = searchQuery.toLowerCase();
    return episodicMemories.filter(m =>
      m.trigger.toLowerCase().includes(q) ||
      m.emotion.toLowerCase().includes(q) ||
      m.context.toLowerCase().includes(q) ||
      (m.lesson && m.lesson.toLowerCase().includes(q)),
    );
  }, [episodicMemories, searchQuery]);

  const filteredRelationship = useMemo(() => {
    if (!searchQuery.trim()) return relationshipMemories;
    const q = searchQuery.toLowerCase();
    return relationshipMemories.filter(m =>
      m.trigger.toLowerCase().includes(q) ||
      m.emotion.toLowerCase().includes(q) ||
      (m.relationshipContext && m.relationshipContext.toLowerCase().includes(q)),
    );
  }, [relationshipMemories, searchQuery]);

  const handleDelete = useCallback((memoryId: string, memoryType: string) => {
    Alert.alert(
      'Remove Memory',
      'Are you sure you want to remove this memory? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Animated.timing(fadeAnim, {
              toValue: 0.3,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              void deleteMemory(memoryId);
              fadeAnim.setValue(1);
              void trackEvent('memory_deleted', { memory_id: memoryId, type: memoryType });
            });
          },
        },
      ],
    );
  }, [deleteMemory, fadeAnim]);

  const handleStartEdit = useCallback((memoryId: string, currentLesson: string) => {
    setExpandedMemory({ id: memoryId, editing: true });
    setEditText(currentLesson);
  }, []);

  const handleSaveEdit = useCallback(async (memoryId: string) => {
    await editMemoryLesson(memoryId, editText);
    setExpandedMemory(null);
    setEditText('');
  }, [editMemoryLesson, editText]);

  const handleCancelEdit = useCallback(() => {
    setExpandedMemory(null);
    setEditText('');
  }, []);

  const toggleExpanded = useCallback((memoryId: string) => {
    if (expandedMemory?.id === memoryId && !expandedMemory.editing) {
      setExpandedMemory(null);
    } else {
      setExpandedMemory({ id: memoryId, editing: false });
    }
  }, [expandedMemory]);

  const totalMemories = useMemo(() => {
    if (!companionMemoryStore) return 0;
    return companionMemoryStore.episodicMemories.length +
      companionMemoryStore.semanticMemories.length +
      companionMemoryStore.sessionSummaries.length;
  }, [companionMemoryStore]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Brain size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No memories yet</Text>
      <Text style={styles.emptyDescription}>
        As you use the AI Companion and check in regularly, meaningful emotional events will be remembered here.
      </Text>
    </View>
  ), []);

  const renderEpisodicCard = useCallback((memory: EpisodicMemory) => {
    const isExpanded = expandedMemory?.id === memory.id;
    const isEditing = isExpanded && expandedMemory?.editing;
    const emotionColor = getEmotionColor(memory.emotion);

    return (
      <TouchableOpacity
        key={memory.id}
        style={styles.memoryCard}
        onPress={() => toggleExpanded(memory.id)}
        activeOpacity={0.7}
        testID={`memory-card-${memory.id}`}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.emotionDot, { backgroundColor: emotionColor }]} />
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTrigger}>{memory.trigger}</Text>
            <Text style={styles.cardTimestamp}>{formatTimestamp(memory.timestamp)}</Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={18} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} />
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.emotionBadge}>
            <Heart size={12} color={emotionColor} />
            <Text style={[styles.emotionText, { color: emotionColor }]}>{memory.emotion}</Text>
          </View>
          {memory.intensity && (
            <View style={styles.intensityBadge}>
              <Zap size={12} color={Colors.accent} />
              <Text style={styles.intensityText}>{memory.intensity}/10</Text>
            </View>
          )}
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.contextText}>{memory.context}</Text>

            {memory.copingUsed && memory.copingUsed.length > 0 && (
              <View style={styles.copingRow}>
                <Shield size={14} color={Colors.primary} />
                <Text style={styles.copingLabel}>
                  Coping: {memory.copingUsed.join(', ')}
                </Text>
              </View>
            )}

            {memory.outcome && (
              <View style={styles.outcomeRow}>
                <Check size={14} color={Colors.success} />
                <Text style={styles.outcomeLabel}>{memory.outcome}</Text>
              </View>
            )}

            {isEditing ? (
              <View style={styles.editContainer}>
                <Text style={styles.editLabel}>Lesson / Insight</Text>
                <TextInput
                  style={styles.editInput}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  placeholder="What did you learn from this moment?"
                  placeholderTextColor={Colors.textMuted}
                  testID="edit-lesson-input"
                />
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.editCancelBtn} onPress={handleCancelEdit}>
                    <X size={16} color={Colors.textSecondary} />
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editSaveBtn}
                    onPress={() => void handleSaveEdit(memory.id)}
                  >
                    <Check size={16} color={Colors.white} />
                    <Text style={styles.editSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : memory.lesson ? (
              <View style={styles.lessonRow}>
                <Lightbulb size={14} color={Colors.accent} />
                <Text style={styles.lessonText}>{memory.lesson}</Text>
              </View>
            ) : null}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleStartEdit(memory.id, memory.lesson ?? '')}
              >
                <Pencil size={14} color={Colors.primary} />
                <Text style={styles.actionBtnText}>
                  {memory.lesson ? 'Edit lesson' : 'Add lesson'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnDanger}
                onPress={() => handleDelete(memory.id, 'episodic')}
              >
                <Trash2 size={14} color={Colors.danger} />
                <Text style={styles.actionBtnDangerText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [expandedMemory, editText, toggleExpanded, handleStartEdit, handleSaveEdit, handleCancelEdit, handleDelete]);

  const renderSemanticCard = useCallback((memory: SemanticMemory) => (
    <View key={memory.id} style={styles.traitCard} testID={`trait-card-${memory.id}`}>
      <View style={styles.traitHeader}>
        <View style={styles.traitIconContainer}>
          <Sparkles size={16} color={Colors.primary} />
        </View>
        <View style={styles.traitHeaderText}>
          <Text style={styles.traitLabel}>{memory.trait}</Text>
          <Text style={styles.traitMeta}>
            Observed {memory.observationCount}x
          </Text>
        </View>
        <TouchableOpacity
          style={styles.traitDeleteBtn}
          onPress={() => handleDelete(memory.id, 'semantic')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Trash2 size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.traitContext}>{memory.context}</Text>
      <View style={styles.confidenceBar}>
        <View
          style={[
            styles.confidenceFill,
            { width: `${Math.round(memory.confidence * 100)}%` },
          ]}
        />
      </View>
      <Text style={styles.confidenceLabel}>
        Confidence: {Math.round(memory.confidence * 100)}%
      </Text>
    </View>
  ), [handleDelete]);

  const renderSessionCard = useCallback((session: SessionSummary) => (
    <View key={session.id} style={styles.sessionCard} testID={`session-card-${session.id}`}>
      <View style={styles.sessionHeader}>
        <Clock size={14} color={Colors.textMuted} />
        <Text style={styles.sessionTime}>{formatTimestamp(session.timestamp)}</Text>
      </View>
      {session.trigger && (
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>Trigger</Text>
          <Text style={styles.sessionValue}>{session.trigger}</Text>
        </View>
      )}
      {session.emotion && (
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>Emotion</Text>
          <Text style={styles.sessionValue}>{session.emotion}</Text>
        </View>
      )}
      {session.insight && (
        <View style={styles.sessionInsight}>
          <Lightbulb size={14} color={Colors.accent} />
          <Text style={styles.sessionInsightText}>{session.insight}</Text>
        </View>
      )}
      {session.skillsPracticed.length > 0 && (
        <View style={styles.skillsRow}>
          {session.skillsPracticed.map((skill, i) => (
            <View key={i} style={styles.skillBadge}>
              <Text style={styles.skillBadgeText}>{skill}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  ), []);

  const renderTabContent = useCallback(() => {
    if (!companionMemoryStore) return renderEmptyState();

    switch (activeTab) {
      case 'events':
        if (filteredEpisodic.length === 0) {
          return searchQuery.trim() ? (
            <View style={styles.emptyContainer}>
              <Search size={36} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No matches found</Text>
              <Text style={styles.emptyDescription}>
                Try a different search term.
              </Text>
            </View>
          ) : renderEmptyState();
        }
        return filteredEpisodic.map(renderEpisodicCard);

      case 'insights':
        if (semanticMemories.length === 0 && sessionSummaries.length === 0) {
          return renderEmptyState();
        }
        return (
          <>
            {semanticMemories.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>Recognized Patterns</Text>
                {semanticMemories.slice(0, 15).map(renderSemanticCard)}
              </View>
            )}
            {sessionSummaries.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>Session Summaries</Text>
                {sessionSummaries.slice(0, 10).map(renderSessionCard)}
              </View>
            )}
          </>
        );

      case 'relationships':
        if (filteredRelationship.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <Users size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No relationship memories</Text>
              <Text style={styles.emptyDescription}>
                When relationship-related emotional events happen, they will appear here.
              </Text>
            </View>
          );
        }
        return filteredRelationship.map(renderEpisodicCard);

      case 'growth':
        if (growthMemories.traits.length === 0 && growthMemories.episodes.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <TrendingUp size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Growth signals will appear here</Text>
              <Text style={styles.emptyDescription}>
                As you practice skills and gain insights, your growth will be tracked here.
              </Text>
            </View>
          );
        }
        return (
          <>
            {growthMemories.traits.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>Strengths Developing</Text>
                {growthMemories.traits.map(renderSemanticCard)}
              </View>
            )}
            {growthMemories.episodes.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>Coping Breakthroughs</Text>
                {growthMemories.episodes.slice(0, 10).map(renderEpisodicCard)}
              </View>
            )}
          </>
        );
    }
  }, [
    activeTab, companionMemoryStore, filteredEpisodic, semanticMemories,
    sessionSummaries, filteredRelationship, growthMemories, searchQuery,
    renderEpisodicCard, renderSemanticCard, renderSessionCard, renderEmptyState,
  ]);

  const tabs: Array<{ key: MemoryTab; label: string; icon: React.ReactNode; count: number }> = useMemo(() => [
    { key: 'events', label: 'Events', icon: <Zap size={16} color={activeTab === 'events' ? Colors.primary : Colors.textMuted} />, count: episodicMemories.length },
    { key: 'insights', label: 'Insights', icon: <Lightbulb size={16} color={activeTab === 'insights' ? Colors.primary : Colors.textMuted} />, count: semanticMemories.length },
    { key: 'relationships', label: 'Relations', icon: <Users size={16} color={activeTab === 'relationships' ? Colors.primary : Colors.textMuted} />, count: relationshipMemories.length },
    { key: 'growth', label: 'Growth', icon: <TrendingUp size={16} color={activeTab === 'growth' ? Colors.primary : Colors.textMuted} />, count: growthMemories.traits.length + growthMemories.episodes.length },
  ], [activeTab, episodicMemories.length, semanticMemories.length, relationshipMemories.length, growthMemories]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            testID="back-button"
          >
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Brain size={20} color={Colors.primary} />
            <Text style={styles.headerTitle}>Emotional Memories</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalMemories}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search memories..."
            placeholderTextColor={Colors.textMuted}
            testID="search-input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabBar}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              testID={`tab-${tab.key}`}
            >
              {tab.icon}
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.tabCount, activeTab === tab.key && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, activeTab === tab.key && styles.tabCountTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderTabContent()}
          </Animated.View>
          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  tabBar: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  tabCount: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center' as const,
  },
  tabCountActive: {
    backgroundColor: Colors.primary,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  tabCountTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    marginTop: 12,
  },
  contentInner: {
    paddingHorizontal: 16,
  },
  memoryCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  emotionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 10,
  },
  cardTrigger: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  cardTimestamp: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardBody: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 10,
    gap: 8,
  },
  emotionBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emotionText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  intensityBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  contextText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  copingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 6,
  },
  copingLabel: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  outcomeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 6,
  },
  outcomeLabel: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500' as const,
  },
  lessonRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 6,
    backgroundColor: Colors.warmGlow,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  lessonText: {
    flex: 1,
    fontSize: 13,
    color: Colors.accent,
    fontStyle: 'italic' as const,
    lineHeight: 18,
  },
  editContainer: {
    marginBottom: 10,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editActions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: 8,
    marginTop: 8,
  },
  editCancelBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  editCancelText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  editSaveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  editSaveText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  cardActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  actionBtnDanger: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  actionBtnDangerText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '500' as const,
  },
  traitCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  traitHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  traitIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  traitHeaderText: {
    flex: 1,
    marginLeft: 10,
  },
  traitLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  traitMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  traitDeleteBtn: {
    padding: 4,
  },
  traitContext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden' as const,
  },
  confidenceFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  confidenceLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sessionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sessionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  sessionTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  sessionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  sessionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    width: 65,
  },
  sessionValue: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  sessionInsight: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 6,
    backgroundColor: Colors.warmGlow,
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  sessionInsightText: {
    flex: 1,
    fontSize: 13,
    color: Colors.accent,
    fontStyle: 'italic' as const,
    lineHeight: 18,
  },
  skillsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 8,
  },
  skillBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skillBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 8,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
