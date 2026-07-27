import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Archive,
  Trash2,
  Check,
  X,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedField, localizedText } from '@/lib/i18n/staticText';
import {
  getDraftVault,
  updateVaultEntry,
  deleteVaultEntry,
} from '@/services/messages/messageOutcomeService';
import { DraftVaultEntry } from '@/types/messageOutcome';

function formatDate(ts: number, language: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3600000) return localizedText(`${Math.max(1, Math.floor(diff / 60000))}m ago`, `hace ${Math.max(1, Math.floor(diff / 60000))} min`);
  if (diff < 86400000) return localizedText(`${Math.floor(diff / 3600000)}h ago`, `hace ${Math.floor(diff / 3600000)} h`);
  return d.toLocaleDateString(language === 'es' ? 'es' : 'en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const REASON_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  saved_for_later: localizedField({ label: 'Saved for later', emoji: '📌', color: '#3B82F6' }, 'label', 'Saved for later', 'Guardado para después'),
  chose_not_to_send: localizedField({ label: 'Chose not to send', emoji: '🛑', color: Colors.danger }, 'label', 'Chose not to send', 'Elegí no enviarlo'),
  paused: localizedField({ label: 'Paused', emoji: '⏳', color: Colors.accent }, 'label', 'Paused', 'Pausado'),
  vault_review: localizedField({ label: 'Under review', emoji: '👁️', color: Colors.primary }, 'label', 'Under review', 'En revisión'),
};

export default function DraftVaultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const vaultQuery = useQuery({
    queryKey: ['draft-vault'],
    queryFn: getDraftVault,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DraftVaultEntry> }) =>
      updateVaultEntry(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['draft-vault'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVaultEntry(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['draft-vault'] });
    },
  });

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      localizedText('Delete Draft', 'Eliminar borrador'),
      localizedText('Remove this draft from your vault?', '¿Eliminar este borrador de tu bóveda?'),
      [
        { text: localizedText('Cancel', 'Cancelar'), style: 'cancel' },
        {
          text: localizedText('Delete', 'Eliminar'),
          style: 'destructive',
          onPress: () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteMutation.mutate(id);
          },
        },
      ],
    );
  }, [deleteMutation]);

  const handleMarkNotSendingHelped = useCallback((id: string, helped: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateMutation.mutate({ id, updates: { notSendingHelped: helped, reviewed: true } });
  }, [updateMutation]);

  const entries = vaultQuery.data ?? [];
  const unreviewed = entries.filter(e => !e.reviewed);
  const reviewed = entries.filter(e => e.reviewed);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{localizedText('Draft Vault', 'Bóveda de borradores')}</Text>
          <Text style={styles.headerSub}>{localizedText('Messages you chose to hold back', 'Mensajes que elegiste pausar')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Archive size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>{localizedText('Your vault is empty', 'Tu bóveda está vacía')}</Text>
            <Text style={styles.emptyDesc}>
              {localizedText(
                'When you save a message instead of sending it, it appears here. You can revisit with a calmer mind.',
                'Cuando guardes un mensaje en vez de enviarlo, aparecerá aquí. Podrás volver a leerlo con más calma.',
              )}
            </Text>
          </View>
        ) : (
          <>
            {unreviewed.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{localizedText(`Needs review (${unreviewed.length})`, `Para revisar (${unreviewed.length})`)}</Text>
                <Text style={styles.sectionHint}>{localizedText('Did not sending help?', '¿Ayudó no enviarlo?')}</Text>
                {unreviewed.map(entry => renderEntry(entry))}
              </View>
            )}

            {reviewed.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{localizedText(`Reviewed (${reviewed.length})`, `Revisados (${reviewed.length})`)}</Text>
                {reviewed.map(entry => renderEntry(entry))}
              </View>
            )}
          </>
        )}

        {entries.length > 0 && (
          <View style={styles.insightCard}>
            <Text style={styles.insightEmoji}>💡</Text>
            <Text style={styles.insightText}>
              {localizedText(
                `You have ${entries.length} saved ${entries.length === 1 ? 'draft' : 'drafts'}.`,
                `Tienes ${entries.length} ${entries.length === 1 ? 'borrador guardado' : 'borradores guardados'}.`,
              )}
              {entries.filter(e => e.notSendingHelped === true).length > 0 &&
                localizedText(
                  ` Not sending helped ${entries.filter(e => e.notSendingHelped === true).length} time${entries.filter(e => e.notSendingHelped === true).length === 1 ? '' : 's'}.`,
                  ` No enviarlo ayudó ${entries.filter(e => e.notSendingHelped === true).length} ${entries.filter(e => e.notSendingHelped === true).length === 1 ? 'vez' : 'veces'}.`,
                )
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  function renderEntry(entry: DraftVaultEntry) {
    const isExpanded = expandedId === entry.id;
    const reasonMeta = REASON_LABELS[entry.reason] ?? REASON_LABELS.saved_for_later;

    return (
      <TouchableOpacity
        key={entry.id}
        style={[styles.entryCard, isExpanded && styles.entryCardExpanded]}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpandedId(isExpanded ? null : entry.id);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryMeta}>
            <Clock size={11} color={Colors.textMuted} />
            <Text style={styles.entryTime}>{formatDate(entry.timestamp, language)}</Text>
          </View>
          <View style={[styles.reasonBadge, { backgroundColor: reasonMeta.color + '15' }]}>
            <Text style={styles.reasonEmoji}>{reasonMeta.emoji}</Text>
            <Text style={[styles.reasonText, { color: reasonMeta.color }]}>{reasonMeta.label}</Text>
          </View>
        </View>

        <Text style={styles.entryText} numberOfLines={isExpanded ? undefined : 2}>
          {entry.originalText}
        </Text>

        {entry.emotionalState && (
          <Text style={styles.entryEmotion}>
            {localizedText('Feeling:', 'Emoción:')} {entry.emotionalState.replace(/_/g, ' ')}
          </Text>
        )}

        {isExpanded && entry.rewrittenText && (
          <View style={styles.rewriteSection}>
            <Text style={styles.rewriteLabel}>{localizedText('Rewritten version', 'Versión reescrita')}</Text>
            <Text style={styles.rewriteText}>{entry.rewrittenText}</Text>
          </View>
        )}

        {isExpanded && entry.situation && (
          <View style={styles.situationSection}>
            <Text style={styles.situationLabel}>{localizedText('Situation', 'Situación')}</Text>
            <Text style={styles.situationText}>{entry.situation}</Text>
          </View>
        )}

        {isExpanded && !entry.reviewed && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewQuestion}>{localizedText('Did not sending help?', '¿Ayudó no enviarlo?')}</Text>
            <View style={styles.reviewBtns}>
              <TouchableOpacity
                style={[styles.reviewBtn, styles.reviewBtnYes]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleMarkNotSendingHelped(entry.id, true);
                }}
                activeOpacity={0.7}
              >
                <Check size={14} color={Colors.success} />
                <Text style={[styles.reviewBtnText, { color: Colors.success }]}>{localizedText('Yes, it helped', 'Sí, ayudó')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewBtn, styles.reviewBtnNo]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleMarkNotSendingHelped(entry.id, false);
                }}
                activeOpacity={0.7}
              >
                <X size={14} color={Colors.textMuted} />
                <Text style={[styles.reviewBtnText, { color: Colors.textMuted }]}>{localizedText('Not sure', 'No estoy seguro/a')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isExpanded && entry.reviewed && entry.notSendingHelped !== null && (
          <View style={[styles.reviewResult, {
            backgroundColor: entry.notSendingHelped ? Colors.successLight : Colors.surface,
          }]}>
            <Text style={styles.reviewResultText}>
              {entry.notSendingHelped
                ? localizedText('✅ Not sending helped — trust that wisdom.', '✅ No enviarlo ayudó; confía en esa sabiduría.')
                : localizedText("🤔 Still uncertain — that's okay too.", '🤔 Aún hay incertidumbre; eso también está bien.')
              }
            </Text>
          </View>
        )}

        {isExpanded && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              handleDelete(entry.id);
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={13} color={Colors.danger} />
            <Text style={styles.deleteBtnText}>{localizedText('Remove from vault', 'Eliminar de la bóveda')}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  entryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  entryCardExpanded: {
    borderColor: Colors.primaryLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reasonEmoji: {
    fontSize: 11,
  },
  reasonText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  entryText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  entryEmotion: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  rewriteSection: {
    marginTop: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
  },
  rewriteLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  rewriteText: {
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
  situationSection: {
    marginTop: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
  },
  situationLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  situationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  reviewSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 14,
  },
  reviewQuestion: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  reviewBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  reviewBtnYes: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success + '30',
  },
  reviewBtnNo: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  reviewResult: {
    marginTop: 12,
    borderRadius: 10,
    padding: 12,
  },
  reviewResultText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  deleteBtnText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500' as const,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  insightEmoji: {
    fontSize: 18,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
});
