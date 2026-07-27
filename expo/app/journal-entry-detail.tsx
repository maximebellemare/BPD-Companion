import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Star,
  Stethoscope,
  Sparkles,
  Trash2,
  Loader,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useJournal } from '@/providers/JournalProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { FORMAT_CONFIG } from '@/types/journalEntry';
import CrossLoopSuggestions from '@/components/CrossLoopSuggestions';
import { getJournalConnectionSuggestions } from '@/services/crossLoop/crossLoopBridgeService';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

function formatFullDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function JournalEntryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const { smartEntries, toggleImportant, toggleTherapyNote, deleteEntry, analyzeEntry, isAnalyzing } = useJournal();
  const { trackEvent } = useAnalytics();
  useLanguage();

  const entry = smartEntries.find(e => e.id === params.id);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    if (entry) {
      trackEvent('journal_entry_detail_viewed', { entryId: entry.id, format: entry.format });
    }
  }, [fadeAnim, entry, trackEvent]);

  const handleDelete = useCallback(() => {
    if (!entry) return;
    Alert.alert(
      localizedText('Delete entry?', '¿Eliminar entrada?'),
      localizedText('This cannot be undone.', 'Esto no se puede deshacer.'),
      [
        { text: localizedText('Cancel', 'Cancelar'), style: 'cancel' },
        {
          text: localizedText('Delete', 'Eliminar'),
          style: 'destructive',
          onPress: () => {
            deleteEntry(entry.id);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ]
    );
  }, [entry, deleteEntry, router]);

  const handleAnalyze = useCallback(async () => {
    if (!entry) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await analyzeEntry(entry);
      trackEvent('journal_ai_analysis_requested', { entryId: entry.id });
    } catch {
      console.log('[JournalDetail] Analysis failed');
    }
  }, [entry, analyzeEntry, trackEvent]);

  if (!entry) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{localizedText('Entry not found', 'Entrada no encontrada')}</Text>
        </View>
      </View>
    );
  }

  const formatConfig = FORMAT_CONFIG[entry.format];
  const distressColor = entry.distressLevel <= 3 ? Colors.success : entry.distressLevel <= 6 ? Colors.accent : Colors.danger;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              toggleImportant(entry.id);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.headerAction}
          >
            <Star
              size={20}
              color={entry.isImportant ? Colors.brandAmber : Colors.textMuted}
              fill={entry.isImportant ? Colors.brandAmber : 'none'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              toggleTherapyNote(entry.id);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.headerAction}
          >
            <Stethoscope
              size={20}
              color={entry.isTherapyNote ? Colors.brandTeal : Colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerAction}>
            <Trash2 size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.metaRow}>
            <View style={styles.formatBadge}>
              <Text style={styles.formatEmoji}>{formatConfig.emoji}</Text>
              <Text style={styles.formatLabel}>{formatConfig.label}</Text>
            </View>
            <View style={[styles.distressBadge, { backgroundColor: distressColor + '18' }]}>
              <Text style={[styles.distressText, { color: distressColor }]}>
                {entry.distressLevel}/10
              </Text>
            </View>
          </View>

          <Text style={styles.dateText}>{formatFullDate(entry.timestamp)}</Text>

          {entry.title && (
            <Text style={styles.entryTitle}>{entry.title}</Text>
          )}

          {entry.format === 'guided_reflection' && entry.guidedResponses ? (
            <View style={styles.guidedContent}>
              {Object.entries(entry.guidedResponses).map(([stepId, response]) => {
                if (!response.trim()) return null;
                return (
                  <View key={stepId} style={styles.guidedStep}>
                    <Text style={styles.guidedResponse}>{response}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.contentText}>{entry.content}</Text>
          )}

          {entry.emotions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{localizedText('Emotions', 'Emociones')}</Text>
              <View style={styles.chipRow}>
                {entry.emotions.map(e => (
                  <View key={e.id} style={styles.emotionChip}>
                    <Text style={styles.chipEmoji}>{e.emoji}</Text>
                    <Text style={styles.chipText}>{e.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {entry.triggers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{localizedText('Triggers', 'Desencadenantes')}</Text>
              <View style={styles.chipRow}>
                {entry.triggers.map(t => (
                  <View key={t.id} style={styles.triggerChip}>
                    <Text style={styles.triggerChipText}>{t.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {entry.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{localizedText('Notes', 'Notas')}</Text>
              <Text style={styles.notesText}>{entry.notes}</Text>
            </View>
          )}

          {entry.aiInsight ? (
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Sparkles size={16} color={Colors.brandLilac} />
                <Text style={styles.insightLabel}>{localizedText('AI Insight', 'Insight de IA')}</Text>
              </View>
              <Text style={styles.insightText}>{entry.aiInsight.summary}</Text>

              {entry.aiInsight.primaryEmotion && (
                <View style={styles.insightRow}>
                  <Text style={styles.insightRowLabel}>{localizedText('Primary emotion', 'Emoción principal')}</Text>
                  <Text style={styles.insightRowValue}>{entry.aiInsight.primaryEmotion}</Text>
                </View>
              )}
              {entry.aiInsight.cognitiveDistortion && (
                <View style={styles.insightRow}>
                  <Text style={styles.insightRowLabel}>{localizedText('Possible pattern', 'Posible patrón')}</Text>
                  <Text style={styles.insightRowValue}>{entry.aiInsight.cognitiveDistortion}</Text>
                </View>
              )}
              {entry.aiInsight.copingSuggestion && (
                <View style={styles.copingCard}>
                  <Text style={styles.copingText}>{entry.aiInsight.copingSuggestion}</Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.analyzeBtn}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader size={18} color={Colors.brandTeal} />
              ) : (
                <Sparkles size={18} color={Colors.brandTeal} />
              )}
              <Text style={styles.analyzeBtnText}>
                {isAnalyzing ? localizedText('Analyzing...', 'Analizando...') : localizedText('Generate AI Insight', 'Generar insight de IA')}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.flagsRow}>
            {entry.isImportant && (
              <View style={styles.flagChip}>
                <Star size={12} color={Colors.brandAmber} fill={Colors.brandAmber} />
                <Text style={styles.flagText}>{localizedText('Important', 'Importante')}</Text>
              </View>
            )}
            {entry.isTherapyNote && (
              <View style={styles.flagChip}>
                <Stethoscope size={12} color={Colors.brandTeal} />
                <Text style={styles.flagText}>{localizedText('Therapy note', 'Nota para terapia')}</Text>
              </View>
            )}
          </View>

          <CrossLoopSuggestions
            suggestions={getJournalConnectionSuggestions(entry)}
            context="journal"
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  formatEmoji: {
    fontSize: 14,
  },
  formatLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  distressBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  distressText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  entryTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 28,
  },
  contentText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 25,
    marginBottom: 20,
  },
  guidedContent: {
    marginBottom: 20,
  },
  guidedStep: {
    marginBottom: 16,
  },
  guidedResponse: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brandLilacSoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.brandLilac,
  },
  triggerChip: {
    backgroundColor: Colors.accentLight,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  triggerChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.accent,
  },
  notesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  insightCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginTop: 4,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  insightRowLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  insightRowValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    maxWidth: '60%',
    textAlign: 'right' as const,
  },
  copingCard: {
    backgroundColor: Colors.brandTealSoft,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  copingText: {
    fontSize: 13,
    color: Colors.brandTeal,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brandTealSoft,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.brandTeal + '30',
  },
  analyzeBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  flagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  flagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  flagText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
});
