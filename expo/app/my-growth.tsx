import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Sparkles,
  Flame,
  Shield,
  TrendingUp,
  ChevronRight,
  Send,
  BookOpen,
  Compass,
  Anchor,
  Star,
  ChevronDown,
  ChevronUp,
  Leaf,
  Target,
  Lightbulb,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useGrowth } from '@/hooks/useGrowth';
import { useIdentityValues } from '@/hooks/useIdentity';
import type { GrowthSignal } from '@/types/identity';

const SIGNAL_TYPE_META: Record<GrowthSignal['type'], { label: string; color: string; bg: string; icon: string }> = {
  value_alignment: { label: 'Value Alignment', color: '#14B8A6', bg: '#0B1238', icon: 'compass' },
  regulation_win: { label: 'Regulation Win', color: '#14B8A6', bg: '#FFFFFF', icon: 'shield' },
  boundary_set: { label: 'Boundary Set', color: '#3B82F6', bg: '#FFFFFF', icon: 'shield' },
  self_awareness: { label: 'Self-Awareness', color: '#3B82F6', bg: '#FFFFFF', icon: 'eye' },
  relationship_skill: { label: 'Relationship Skill', color: '#3B82F6', bg: '#FFFFFF', icon: 'heart' },
  emotional_growth: { label: 'Emotional Growth', color: '#67E8F9', bg: '#FFFFFF', icon: 'trending' },
};

export default function MyGrowthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    snapshot,
    isLoading,
    todaysPrompt,
    hasAnsweredToday,
    dailyResponses,
    growthSignals,
    personalStrengths,
    saveDailyResponse,
    isSavingDaily,
    addPersonalStrength,
  } = useGrowth();
  const { selectedValues } = useIdentityValues();

  const [isAnswering, setIsAnswering] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [showPastResponses, setShowPastResponses] = useState(false);
  const [showAddStrength, setShowAddStrength] = useState(false);
  const [strengthLabel, setStrengthLabel] = useState('');
  const [strengthDescription, setStrengthDescription] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleStartAnswer = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsAnswering(true);
    setResponseText('');
  }, []);

  const handleSaveResponse = useCallback(() => {
    if (!todaysPrompt || !responseText.trim()) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    saveDailyResponse({
      promptId: todaysPrompt.id,
      promptText: todaysPrompt.text,
      response: responseText.trim(),
    });
    setIsAnswering(false);
    setResponseText('');
  }, [todaysPrompt, responseText, saveDailyResponse]);

  const handleSaveStrength = useCallback(() => {
    if (!strengthLabel.trim()) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    addPersonalStrength({
      label: strengthLabel.trim(),
      description: strengthDescription.trim(),
      evidence: [],
    });
    setShowAddStrength(false);
    setStrengthLabel('');
    setStrengthDescription('');
  }, [strengthLabel, strengthDescription, addPersonalStrength]);

  const recentResponses = useMemo(
    () => dailyResponses.slice(0, 10),
    [dailyResponses],
  );

  const recentSignals = useMemo(
    () => growthSignals.slice(0, 8),
    [growthSignals],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your growth...</Text>
        </View>
      </View>
    );
  }

  if (isAnswering) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setIsAnswering(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Daily Reflection</Text>
          </View>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.answerContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.promptHighlight}>
            <Lightbulb size={20} color={Colors.accent} />
            <Text style={styles.promptHighlightText}>{todaysPrompt.text}</Text>
          </View>

          <TextInput
            style={styles.answerInput}
            value={responseText}
            onChangeText={setResponseText}
            placeholder="Write from wherever you are right now..."
            placeholderTextColor={Colors.textMuted}
            multiline
            textAlignVertical="top"
            autoFocus
            testID="growth-response-input"
          />

          <TouchableOpacity
            style={[styles.saveResponseBtn, !responseText.trim() && styles.saveResponseBtnDisabled]}
            onPress={handleSaveResponse}
            disabled={!responseText.trim() || isSavingDaily}
            activeOpacity={0.7}
            testID="save-growth-response"
          >
            <Send size={18} color={Colors.white} />
            <Text style={styles.saveResponseBtnText}>
              {isSavingDaily ? 'Saving...' : 'Save Reflection'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID="close-growth"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Growth</Text>
          <Text style={styles.headerSubtitle}>Building a stronger sense of self</Text>
        </View>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {!hasAnsweredToday && (
            <TouchableOpacity
              style={styles.dailyPromptCard}
              onPress={handleStartAnswer}
              activeOpacity={0.8}
              testID="daily-prompt-card"
            >
              <View style={styles.dailyPromptHeader}>
                <View style={styles.dailyPromptBadge}>
                  <Sparkles size={14} color={Colors.white} />
                  <Text style={styles.dailyPromptBadgeText}>Today's Prompt</Text>
                </View>
                {(snapshot?.identityStreakDays ?? 0) > 0 && (
                  <View style={styles.streakBadge}>
                    <Flame size={12} color="#3B82F6" />
                    <Text style={styles.streakBadgeText}>{snapshot?.identityStreakDays}d</Text>
                  </View>
                )}
              </View>
              <Text style={styles.dailyPromptText}>{todaysPrompt.text}</Text>
              <View style={styles.dailyPromptAction}>
                <Text style={styles.dailyPromptActionText}>Tap to reflect</Text>
                <ChevronRight size={16} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          )}

          {hasAnsweredToday && (
            <View style={styles.completedPromptCard}>
              <View style={styles.completedPromptRow}>
                <View style={styles.completedCheckmark}>
                  <Leaf size={16} color={Colors.white} />
                </View>
                <View style={styles.completedPromptInfo}>
                  <Text style={styles.completedPromptLabel}>Today's reflection complete</Text>
                  {(snapshot?.identityStreakDays ?? 0) > 0 && (
                    <Text style={styles.completedStreakText}>
                      {snapshot?.identityStreakDays} day streak
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {selectedValues.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Compass size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Your Values</Text>
                <TouchableOpacity
                  onPress={() => router.push('/values-explorer')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sectionAction}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.valuesGrid}>
                {selectedValues.map((value) => (
                  <View key={value.id} style={styles.valueChip}>
                    <Text style={styles.valueChipEmoji}>{value.emoji}</Text>
                    <Text style={styles.valueChipLabel}>{value.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.valuesHint}>
                Your values guide recommendations in Message Guard, Relationship Copilot, and AI Companion.
              </Text>
            </View>
          )}

          {selectedValues.length === 0 && (
            <TouchableOpacity
              style={styles.emptyValuesCard}
              onPress={() => router.push('/values-explorer')}
              activeOpacity={0.7}
            >
              <Compass size={24} color={Colors.primary} />
              <Text style={styles.emptyValuesTitle}>Discover Your Values</Text>
              <Text style={styles.emptyValuesDesc}>
                Choosing your core values helps the app support you in ways that feel true to who you are.
              </Text>
              <View style={styles.emptyValuesAction}>
                <Text style={styles.emptyValuesActionText}>Explore values</Text>
                <ChevronRight size={16} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          )}

          {personalStrengths.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Star size={18} color="#67E8F9" />
                <Text style={styles.sectionTitle}>Personal Strengths</Text>
                <TouchableOpacity
                  onPress={() => setShowAddStrength(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sectionAction}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {personalStrengths.slice(0, 5).map((strength) => (
                <View key={strength.id} style={styles.strengthCard}>
                  <View style={styles.strengthIcon}>
                    <Star size={16} color="#67E8F9" />
                  </View>
                  <View style={styles.strengthContent}>
                    <Text style={styles.strengthLabel}>{strength.label}</Text>
                    {strength.description ? (
                      <Text style={styles.strengthDescription}>{strength.description}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {personalStrengths.length === 0 && (
            <TouchableOpacity
              style={styles.addStrengthPrompt}
              onPress={() => setShowAddStrength(true)}
              activeOpacity={0.7}
            >
              <Star size={20} color="#67E8F9" />
              <View style={styles.addStrengthPromptContent}>
                <Text style={styles.addStrengthPromptTitle}>Name a Strength</Text>
                <Text style={styles.addStrengthPromptDesc}>
                  What are you good at, even when things feel hard?
                </Text>
              </View>
              <ChevronRight size={16} color="#67E8F9" />
            </TouchableOpacity>
          )}

          {showAddStrength && (
            <View style={styles.addStrengthForm}>
              <Text style={styles.addStrengthFormTitle}>Add a Personal Strength</Text>
              <TextInput
                style={styles.addStrengthInput}
                value={strengthLabel}
                onChangeText={setStrengthLabel}
                placeholder="e.g. I stay calm under pressure"
                placeholderTextColor={Colors.textMuted}
                testID="strength-label-input"
              />
              <TextInput
                style={[styles.addStrengthInput, styles.addStrengthDescInput]}
                value={strengthDescription}
                onChangeText={setStrengthDescription}
                placeholder="Describe when this shows up (optional)"
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
                testID="strength-desc-input"
              />
              <View style={styles.addStrengthActions}>
                <TouchableOpacity
                  style={styles.addStrengthCancel}
                  onPress={() => { setShowAddStrength(false); setStrengthLabel(''); setStrengthDescription(''); }}
                >
                  <Text style={styles.addStrengthCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addStrengthSave, !strengthLabel.trim() && styles.addStrengthSaveDisabled]}
                  onPress={handleSaveStrength}
                  disabled={!strengthLabel.trim()}
                  testID="save-strength"
                >
                  <Text style={styles.addStrengthSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {recentSignals.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={18} color="#14B8A6" />
                <Text style={styles.sectionTitle}>Growth Signals</Text>
              </View>
              {recentSignals.map((signal) => {
                const meta = SIGNAL_TYPE_META[signal.type];
                return (
                  <View key={signal.id} style={[styles.signalCard, { borderLeftColor: meta.color }]}>
                    <View style={[styles.signalBadge, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.signalBadgeText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <Text style={styles.signalLabel}>{signal.label}</Text>
                    <Text style={styles.signalDescription}>{signal.description}</Text>
                    <Text style={styles.signalDate}>
                      {new Date(signal.detectedAt).toLocaleDateString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpen size={18} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Identity Reflections</Text>
              <TouchableOpacity
                onPress={() => setShowPastResponses(!showPastResponses)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showPastResponses ? (
                  <ChevronUp size={18} color={Colors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {recentResponses.length === 0 && (
              <View style={styles.emptyReflections}>
                <Text style={styles.emptyReflectionsText}>
                  Your daily reflections will appear here. Start by answering today's prompt above.
                </Text>
              </View>
            )}

            {showPastResponses && recentResponses.map((response) => {
              return (
                <View key={response.id} style={styles.responseCard}>
                  <Text style={styles.responsePrompt}>{response.promptText}</Text>
                  <Text style={styles.responseContent}>{response.response}</Text>
                  <Text style={styles.responseDate}>
                    {new Date(response.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Target size={18} color={Colors.text} />
              <Text style={styles.sectionTitle}>Identity Tools</Text>
            </View>

            <View style={styles.toolsGrid}>
              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => router.push('/values-explorer')}
                activeOpacity={0.7}
              >
                <View style={[styles.toolIcon, { backgroundColor: '#0B1238' }]}>
                  <Compass size={20} color="#14B8A6" />
                </View>
                <Text style={styles.toolLabel}>Values Explorer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => router.push('/identity-journal')}
                activeOpacity={0.7}
              >
                <View style={[styles.toolIcon, { backgroundColor: '#FFFFFF' }]}>
                  <BookOpen size={20} color="#3B82F6" />
                </View>
                <Text style={styles.toolLabel}>Identity Journal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => router.push('/self-trust-prompts')}
                activeOpacity={0.7}
              >
                <View style={[styles.toolIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Shield size={20} color="#14B8A6" />
                </View>
                <Text style={styles.toolLabel}>Self-Trust</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => router.push('/anchor-statements')}
                activeOpacity={0.7}
              >
                <View style={[styles.toolIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Anchor size={20} color="#67E8F9" />
                </View>
                <Text style={styles.toolLabel}>Anchors</Text>
              </TouchableOpacity>
            </View>
          </View>

          {snapshot && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Your Identity Work</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{snapshot.selectedValuesCount}</Text>
                  <Text style={styles.statLabel}>Values</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{snapshot.totalJournalEntries}</Text>
                  <Text style={styles.statLabel}>Journals</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{snapshot.totalSelfTrustResponses}</Text>
                  <Text style={styles.statLabel}>Self-Trust</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{snapshot.totalAnchorStatements}</Text>
                  <Text style={styles.statLabel}>Anchors</Text>
                </View>
              </View>
            </View>
          )}

        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dailyPromptCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  dailyPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dailyPromptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dailyPromptBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  dailyPromptText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 30,
    marginBottom: 16,
  },
  dailyPromptAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dailyPromptActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  completedPromptCard: {
    backgroundColor: Colors.successLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  completedPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completedCheckmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedPromptInfo: {
    flex: 1,
  },
  completedPromptLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  completedStreakText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  valueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  valueChipEmoji: {
    fontSize: 16,
  },
  valueChipLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  valuesHint: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  emptyValuesCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyValuesTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyValuesDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  emptyValuesAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyValuesActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  strengthCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  strengthIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthContent: {
    flex: 1,
  },
  strengthLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  strengthDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  addStrengthPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: '#0B1238',
  },
  addStrengthPromptContent: {
    flex: 1,
  },
  addStrengthPromptTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  addStrengthPromptDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  addStrengthForm: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  addStrengthFormTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  addStrengthInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 10,
  },
  addStrengthDescInput: {
    minHeight: 80,
  },
  addStrengthActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  addStrengthCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  addStrengthCancelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  addStrengthSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  addStrengthSaveDisabled: {
    opacity: 0.5,
  },
  addStrengthSaveText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  signalCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  signalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  signalBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  signalLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  signalDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 6,
  },
  signalDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyReflections: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyReflectionsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  responseCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  responsePrompt: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 8,
    lineHeight: 20,
  },
  responseContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  responseDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolCard: {
    width: '47%' as unknown as number,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight,
  },
  answerContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  promptHighlight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  promptHighlightText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 28,
  },
  answerInput: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 200,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  saveResponseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  saveResponseBtnDisabled: {
    opacity: 0.5,
  },
  saveResponseBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
