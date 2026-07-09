import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Check, FileText, MessageCircle, RotateCcw, Save } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useApp } from '@/providers/AppProvider';
import { JournalEntry } from '@/types';
import { trackEvent } from '@/services/analytics/analyticsService';

export type StructuredReflectionStep = {
  id: string;
  label: string;
  question: string;
  placeholder: string;
  optional?: boolean;
  kind?: 'text' | 'intensity';
};

type Props = {
  title: string;
  eyebrow: string;
  subtitle: string;
  primaryPurpose: string;
  visualIcon?: string;
  visualTheme?: 'investigation' | 'growth' | 'neutral';
  steps: StructuredReflectionStep[];
  eventName: string;
  buildSummary: (responses: Record<string, string>) => string;
  buildCompanionPrompt: (responses: Record<string, string>) => string;
};

function intensityOptions(): string[] {
  return Array.from({ length: 10 }, (_, index) => String(index + 1));
}

export default function StructuredReflectionTool({
  title,
  eyebrow,
  subtitle,
  primaryPurpose,
  visualIcon = '•',
  visualTheme = 'neutral',
  steps,
  eventName,
  buildSummary,
  buildCompanionPrompt,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const accentColor = visualTheme === 'growth'
    ? colors.success
    : visualTheme === 'investigation'
      ? colors.primary
      : colors.brandTeal;
  const accentBg = visualTheme === 'growth'
    ? colors.successLight
    : visualTheme === 'investigation'
      ? colors.primaryLight
      : colors.brandTealSoft;
  const { addJournalEntry, journalEntries } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const currentStep = steps[currentIndex];
  const isLast = currentIndex === steps.length - 1;
  const currentValue = responses[currentStep.id] ?? '';
  const canContinue = currentStep.optional || currentValue.trim().length > 0;
  const progress = `${currentIndex + 1} of ${steps.length}`;
  const summary = useMemo(() => buildSummary(responses), [buildSummary, responses]);
  const pastRecords = useMemo(
    () => journalEntries.filter(entry => entry.id.startsWith(`j_tool_${eventName}_`)).slice(0, 3),
    [eventName, journalEntries],
  );

  const setResponse = useCallback((id: string, value: string) => {
    setResponses(prev => ({ ...prev, [id]: value }));
    setSaved(false);
  }, []);

  const handleBack = useCallback(() => {
    if (currentIndex === 0) {
      router.back();
      return;
    }
    setCurrentIndex(index => Math.max(0, index - 1));
  }, [currentIndex, router]);

  const saveEntry = useCallback(() => {
    const now = Date.now();
    const emotion = responses.emotion || responses.newEmotion || responses.mainEmotion || 'Reflection';
    const trigger = responses.trigger || responses.situation || responses.whatHappened || 'Reflection';
    const urge = responses.urge || 'Reflect';
    const intensity = Number(responses.intensity || responses.newIntensity || responses.emotionIntensity || 5);
    const entry: JournalEntry = {
      id: `j_tool_${eventName}_${now}`,
      timestamp: now,
      checkIn: {
        id: `ci_tool_${eventName}_${now}`,
        timestamp: now,
        triggers: [{ id: `trigger_${now}`, label: trigger.trim(), category: 'other' }],
        emotions: [{ id: `emotion_${now}`, label: emotion.trim(), emoji: '•' }],
        urges: [{ id: `urge_${now}`, label: urge.trim(), risk: intensity >= 7 ? 'high' : intensity >= 4 ? 'medium' : 'low' }],
        bodySensations: [],
        intensityLevel: Number.isFinite(intensity) ? Math.max(1, Math.min(10, intensity)) : 5,
        notes: summary,
      },
      reflection: summary,
      outcome: 'neutral',
    };
    addJournalEntry(entry);
    setSaved(true);
    void trackEvent(`${eventName}_completed`, { step_count: steps.length });
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [addJournalEntry, eventName, responses, steps.length, summary]);

  const handleNext = useCallback(() => {
    if (!canContinue) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (isLast) {
      saveEntry();
      return;
    }
    setCurrentIndex(index => Math.min(steps.length - 1, index + 1));
  }, [canContinue, isLast, saveEntry, steps.length]);

  const handleCompanion = useCallback(() => {
    router.push({
      pathname: '/(tabs)/companion/chat',
      params: { initialMessage: buildCompanionPrompt(responses) },
    } as never);
  }, [buildCompanionPrompt, responses, router]);

  const handleStartAnother = useCallback(() => {
    setResponses({});
    setCurrentIndex(0);
    setSaved(false);
  }, []);

  if (saved) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.completionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={[styles.completionIcon, { backgroundColor: colors.successLight }]}>
              <Check size={28} color={colors.success} />
            </View>
            <Text style={[styles.completionTitle, { color: colors.text }]}>
              {eventName === 'cbt_thought_record' ? 'Thought record saved.' : 'Reflection saved.'}
            </Text>
            <Text style={[styles.completionBody, { color: colors.textSecondary }]}>
              It has been added to your emotional map so Companion and Insights can use it later.
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={styles.summaryHeader}>
              <FileText size={18} color={colors.primary} />
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Saved summary</Text>
            </View>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{summary}</Text>
          </View>

          <View style={styles.completionActions}>
            <TouchableOpacity
              style={[styles.primaryCompletionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/insights' as never)}
              activeOpacity={0.86}
            >
              <Text style={styles.primaryButtonText}>View in Insights / Records</Text>
              <ArrowRight size={17} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completionButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              onPress={handleCompanion}
              activeOpacity={0.82}
            >
              <MessageCircle size={17} color={colors.primary} />
              <Text style={[styles.completionButtonText, { color: colors.primary }]}>Talk to Companion about this</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completionButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              onPress={() => router.replace('/(tabs)/tools' as never)}
              activeOpacity={0.82}
            >
              <ArrowLeft size={17} color={colors.primary} />
              <Text style={[styles.completionButtonText, { color: colors.primary }]}>Back to Tools</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completionButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              onPress={handleStartAnother}
              activeOpacity={0.82}
            >
              <RotateCcw size={17} color={colors.primary} />
              <Text style={[styles.completionButtonText, { color: colors.primary }]}>Reflect on something else</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.visualHero, { backgroundColor: accentBg, borderColor: colors.borderLight }]}>
            <Text style={styles.visualIcon}>{visualIcon}</Text>
            <View style={styles.visualTextWrap}>
              <Text style={[styles.eyebrow, { color: accentColor }]}>{eyebrow}</Text>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.purposeCard, { backgroundColor: colors.card, borderColor: accentColor }]}>
          <Text style={[styles.purposeLabel, { color: colors.textSecondary }]}>This tool answers</Text>
          <Text style={[styles.purposeText, { color: colors.text }]}>{primaryPurpose}</Text>
        </View>

        {eventName === 'cbt_thought_record' && pastRecords.length > 0 ? (
          <View style={[styles.pastRecordsCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={styles.summaryHeader}>
              <FileText size={18} color={colors.primary} />
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Past Records</Text>
            </View>
            {pastRecords.map(record => (
              <View key={record.id} style={[styles.pastRecordRow, { borderColor: colors.borderLight }]}>
                <Text style={[styles.pastRecordTitle, { color: colors.text }]} numberOfLines={1}>
                  {record.checkIn.triggers[0]?.label ?? 'Thought record'}
                </Text>
                <Text style={[styles.pastRecordMeta, { color: colors.textSecondary }]}>
                  {new Date(record.timestamp).toLocaleDateString()} · intensity {record.checkIn.intensityLevel}/10
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.borderLight }]}
              onPress={() => router.push('/(tabs)/insights' as never)}
              activeOpacity={0.82}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>View in Insights / Records</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: accentColor }]}>{progress}</Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: accentColor, width: `${((currentIndex + 1) / steps.length) * 100}%` },
                ]}
              />
            </View>
          </View>

          <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>{currentStep.label}</Text>
          <Text style={[styles.stepQuestion, { color: colors.text }]}>{currentStep.question}</Text>

          {currentStep.kind === 'intensity' ? (
            <View style={styles.intensityGrid}>
              {intensityOptions().map(option => {
                const selected = currentValue === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.intensityButton,
                      {
                        backgroundColor: selected ? accentColor : colors.surface,
                        borderColor: selected ? accentColor : colors.borderLight,
                      },
                    ]}
                    onPress={() => setResponse(currentStep.id, option)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.intensityText, { color: selected ? Colors.white : colors.text }]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TextInput
              value={currentValue}
              onChangeText={(value) => setResponse(currentStep.id, value)}
              placeholder={currentStep.placeholder}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.borderLight, color: colors.text },
              ]}
              multiline
              textAlignVertical="top"
            />
          )}

          <TouchableOpacity
            style={[styles.companionLink, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={handleCompanion}
            activeOpacity={0.8}
          >
            <MessageCircle size={15} color={colors.primary} />
            <Text style={[styles.companionLinkText, { color: colors.primary }]}>Ask Companion to help with this step</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: canContinue ? colors.primary : colors.border }]}
          onPress={handleNext}
          disabled={!canContinue}
          activeOpacity={0.86}
        >
          {isLast ? <Save size={17} color={Colors.white} /> : <ArrowRight size={17} color={Colors.white} />}
          <Text style={styles.primaryButtonText}>{isLast ? (saved ? 'Saved' : 'Save reflection') : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 },
  header: { marginBottom: 16 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  visualHero: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  visualIcon: {
    fontSize: 34,
    lineHeight: 42,
  },
  visualTextWrap: {
    flex: 1,
  },
  eyebrow: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  purposeCard: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 12 },
  purposeLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 5 },
  purposeText: { fontSize: 16, lineHeight: 22, fontWeight: '900' },
  stepCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 },
  progressRow: { marginBottom: 16 },
  progressText: { fontSize: 12, fontWeight: '900', marginBottom: 8 },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999 },
  stepLabel: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', marginBottom: 7 },
  stepQuestion: { fontSize: 21, lineHeight: 28, fontWeight: '900', marginBottom: 14 },
  input: {
    minHeight: 150,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  intensityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  intensityButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityText: { fontSize: 16, fontWeight: '900' },
  companionLink: {
    marginTop: 12,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  companionLinkText: { fontSize: 13, fontWeight: '900' },
  summaryCard: { borderWidth: 1, borderRadius: 18, padding: 15 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summaryTitle: { fontSize: 16, fontWeight: '900' },
  summaryText: { fontSize: 14, lineHeight: 21, fontWeight: '700' },
  completionCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 12,
  },
  completionIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  completionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionBody: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  completionActions: {
    gap: 10,
  },
  primaryCompletionButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  completionButton: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  completionButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
  pastRecordsCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
  },
  pastRecordRow: {
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  pastRecordTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },
  pastRecordMeta: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '900' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: { color: Colors.white, fontSize: 15, fontWeight: '900' },
});
