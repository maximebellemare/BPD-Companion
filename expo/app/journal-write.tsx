import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Sparkles,
  Loader,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import { useJournal } from '@/providers/JournalProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  JournalEntryFormat,
  FORMAT_CONFIG,
  JOURNAL_EMOTIONS,
  SmartJournalEntry,
} from '@/types/journalEntry';
import { Emotion, Trigger } from '@/types';
import { TRIGGERS } from '@/constants/data';

const DISTRESS_LABELS = [
  localizedText('Calm', 'Calma'),
  '',
  '',
  localizedText('Mild', 'Leve'),
  '',
  '',
  localizedText('Moderate', 'Moderada'),
  '',
  '',
  localizedText('Intense', 'Intensa'),
];

export default function JournalWriteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLanguage();
  const params = useLocalSearchParams<{ format?: string }>();
  const { addEntry, analyzeEntry, isAnalyzing } = useJournal();
  const { trackEvent } = useAnalytics();

  const format = (params.format as JournalEntryFormat) || 'free_writing';
  const config = FORMAT_CONFIG[format];

  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<Trigger[]>([]);
  const [distressLevel, setDistressLevel] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [showEmotions, setShowEmotions] = useState<boolean>(false);
  const [showTriggers, setShowTriggers] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedEntry, setSavedEntry] = useState<SmartJournalEntry | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    trackEvent('journal_write_opened', { format });
  }, [fadeAnim, trackEvent, format]);

  const toggleEmotion = useCallback((emotion: Emotion) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmotions(prev =>
      prev.some(e => e.id === emotion.id)
        ? prev.filter(e => e.id !== emotion.id)
        : [...prev, emotion]
    );
  }, []);

  const toggleTrigger = useCallback((trigger: Trigger) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTriggers(prev =>
      prev.some(t => t.id === trigger.id)
        ? prev.filter(t => t.id !== trigger.id)
        : [...prev, trigger]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!content.trim()) {
      Alert.alert(
        localizedText('Empty entry', 'Entrada vacía'),
        localizedText('Write something before saving.', 'Escribe algo antes de guardar.'),
      );
      return;
    }

    setIsSaving(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const entry = addEntry({
        format,
        title: title.trim() || undefined,
        content: content.trim(),
        emotions: selectedEmotions,
        triggers: selectedTriggers,
        distressLevel,
        notes: notes.trim() || undefined,
      });

      setSavedEntry(entry);
      trackEvent('journal_entry_saved', {
        format,
        emotionCount: selectedEmotions.length,
        distressLevel,
        hasTitle: !!title.trim(),
      });

      try {
        await analyzeEntry(entry);
        trackEvent('journal_ai_analysis_completed', { entryId: entry.id });
      } catch {
        console.log('[JournalWrite] AI analysis failed, entry still saved');
      }
    } catch (err) {
      console.error('[JournalWrite] Save failed:', err);
      Alert.alert(
        localizedText('Error', 'Error'),
        localizedText('Could not save entry. Please try again.', 'No se pudo guardar la entrada. Inténtalo de nuevo.'),
      );
    } finally {
      setIsSaving(false);
    }
  }, [content, title, format, selectedEmotions, selectedTriggers, distressLevel, notes, addEntry, analyzeEntry, trackEvent]);

  const handleClose = useCallback(() => {
    if (content.trim() && !savedEntry) {
      Alert.alert(
        localizedText('Discard entry?', '¿Descartar entrada?'),
        localizedText('Your writing will not be saved.', 'Lo que escribiste no se guardará.'),
        [
          { text: localizedText('Keep writing', 'Seguir escribiendo'), style: 'cancel' },
          { text: localizedText('Discard', 'Descartar'), style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }, [content, savedEntry, router]);

  if (savedEntry) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.savedContainer}>
          <View style={styles.savedIconCircle}>
            <Bookmark size={32} color={Colors.brandTeal} />
          </View>
          <Text style={styles.savedTitle}>{localizedText('Entry saved', 'Entrada guardada')}</Text>
          <Text style={styles.savedSubtitle}>
            {localizedText(
              'Taking the time to write about how you feel is a powerful act of self-awareness.',
              'Tomarte el tiempo para escribir sobre cómo te sientes es un acto poderoso de autoconciencia.',
            )}
          </Text>

          {isAnalyzing && (
            <View style={styles.analyzingCard}>
              <Loader size={18} color={Colors.brandTeal} />
              <Text style={styles.analyzingText}>{localizedText('Generating insight...', 'Generando insight...')}</Text>
            </View>
          )}

          {savedEntry.aiInsight && !isAnalyzing && (
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Sparkles size={16} color={Colors.brandLilac} />
                <Text style={styles.insightLabel}>{localizedText('AI Insight', 'Insight de IA')}</Text>
              </View>
              <Text style={styles.insightText}>{savedEntry.aiInsight.summary}</Text>
              {savedEntry.aiInsight.copingSuggestion && (
                <Text style={styles.insightCoping}>{savedEntry.aiInsight.copingSuggestion}</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnText}>{localizedText('Done', 'Listo')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerEmoji}>{config.emoji}</Text>
              <Text style={styles.headerTitle}>{config.label}</Text>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, (!content.trim() || isSaving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!content.trim() || isSaving}
            >
              <Text style={[styles.saveBtnText, (!content.trim() || isSaving) && styles.saveBtnTextDisabled]}>
                {isSaving ? localizedText('Saving...', 'Guardando...') : localizedText('Save', 'Guardar')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder={localizedText('Title (optional)', 'Título (opcional)')}
              placeholderTextColor={Colors.textMuted}
              maxLength={100}
            />

            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder={config.placeholder}
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.distressSection}>
              <Text style={styles.sectionLabel}>Distress level</Text>
              <View style={styles.distressRow}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.distressDot,
                      distressLevel === level && styles.distressDotActive,
                      {
                        backgroundColor:
                          distressLevel === level
                            ? level <= 3
                              ? Colors.success
                              : level <= 6
                              ? Colors.accent
                              : Colors.danger
                            : Colors.surface,
                      },
                    ]}
                    onPress={() => {
                      setDistressLevel(level);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.distressDotText,
                        distressLevel === level && styles.distressDotTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.distressLabel}>
                {DISTRESS_LABELS[distressLevel - 1] || ''}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.expandSection}
              onPress={() => setShowEmotions(!showEmotions)}
            >
              <Text style={styles.sectionLabel}>
                Emotions {selectedEmotions.length > 0 ? `(${selectedEmotions.length})` : ''}
              </Text>
              {showEmotions ? (
                <ChevronUp size={18} color={Colors.textMuted} />
              ) : (
                <ChevronDown size={18} color={Colors.textMuted} />
              )}
            </TouchableOpacity>

            {showEmotions && (
              <View style={styles.chipGrid}>
                {JOURNAL_EMOTIONS.map(emotion => {
                  const selected = selectedEmotions.some(e => e.id === emotion.id);
                  return (
                    <TouchableOpacity
                      key={emotion.id}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => toggleEmotion(emotion)}
                    >
                      <Text style={styles.chipEmoji}>{emotion.emoji}</Text>
                      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                        {emotion.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={styles.expandSection}
              onPress={() => setShowTriggers(!showTriggers)}
            >
              <Text style={styles.sectionLabel}>
                Triggers {selectedTriggers.length > 0 ? `(${selectedTriggers.length})` : ''}
              </Text>
              {showTriggers ? (
                <ChevronUp size={18} color={Colors.textMuted} />
              ) : (
                <ChevronDown size={18} color={Colors.textMuted} />
              )}
            </TouchableOpacity>

            {showTriggers && (
              <View style={styles.chipGrid}>
                {TRIGGERS.map(trigger => {
                  const selected = selectedTriggers.some(t => t.id === trigger.id);
                  return (
                    <TouchableOpacity
                      key={trigger.id}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => toggleTrigger(trigger)}
                    >
                      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                        {trigger.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.notesSection}>
              <Text style={styles.sectionLabel}>Additional notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder={localizedText('Anything else you want to note...', 'Cualquier otra cosa que quieras anotar...')}
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.brandTeal,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.surface,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  saveBtnTextDisabled: {
    color: Colors.textMuted,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingVertical: 8,
    marginBottom: 4,
  },
  contentInput: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 160,
    paddingVertical: 8,
    marginBottom: 20,
  },
  distressSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  distressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  distressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distressDotActive: {
    transform: [{ scale: 1.15 }],
  },
  distressDotText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  distressDotTextActive: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  distressLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  expandSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.brandTealSoft,
    borderColor: Colors.brandTeal,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  chipLabelSelected: {
    color: Colors.brandTeal,
    fontWeight: '600' as const,
  },
  notesSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  savedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  savedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  savedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  savedSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  analyzingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.brandTealSoft,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 20,
  },
  analyzingText: {
    fontSize: 14,
    color: Colors.brandTeal,
    fontWeight: '500' as const,
  },
  insightCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.brandLilacSoft,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.brandLilac,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 8,
  },
  insightCoping: {
    fontSize: 13,
    color: Colors.brandTeal,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
  doneBtn: {
    backgroundColor: Colors.brandTeal,
    borderRadius: 14,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
