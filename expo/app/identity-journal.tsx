import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Send, Heart, BookOpen, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useIdentityJournal } from '@/hooks/useIdentity';
import { IDENTITY_JOURNAL_PROMPTS } from '@/services/identity/valuesService';
import type { IdentityJournalPrompt } from '@/types/identity';

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'calm-self': { label: 'Calm Self', color: '#6B9080', bg: '#E3EDE8' },
  'conflict-self': { label: 'In Conflict', color: '#D4956A', bg: '#FFF8F0' },
  'relationship-self': { label: 'Relationships', color: '#E84393', bg: '#FFF0F6' },
  'core-self': { label: 'Core Self', color: '#8B5CF6', bg: '#F0E6FF' },
  boundaries: { label: 'Boundaries', color: '#3B82F6', bg: '#E8F0FE' },
};

const JOURNAL_TAGS = ['identity', 'values', 'boundaries', 'calm', 'growth', 'conflict', 'relationship', 'self-trust'];

export default function IdentityJournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entries, save, isSaving, remove, toggleFavorite } = useIdentityJournal();
  const [activePrompt, setActivePrompt] = useState<IdentityJournalPrompt | null>(null);
  const [journalText, setJournalText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showEntries, setShowEntries] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSelectPrompt = useCallback((prompt: IdentityJournalPrompt) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActivePrompt(prompt);
    setJournalText('');
    setSelectedTags([]);
  }, []);

  const handleToggleTag = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!activePrompt || !journalText.trim()) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    save({
      promptId: activePrompt.id,
      promptText: activePrompt.text,
      content: journalText.trim(),
      tags: selectedTags,
    });
    setActivePrompt(null);
    setJournalText('');
    setSelectedTags([]);
  }, [activePrompt, journalText, selectedTags, save]);

  if (activePrompt) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => { setActivePrompt(null); setJournalText(''); }}
          >
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Identity Journal</Text>
          </View>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.journalSessionContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.journalPromptCard}>
            <BookOpen size={20} color={Colors.primary} />
            <Text style={styles.journalPromptText}>{activePrompt.text}</Text>
          </View>

          <TextInput
            style={styles.journalInput}
            value={journalText}
            onChangeText={setJournalText}
            placeholder="Let your thoughts flow..."
            placeholderTextColor={Colors.textMuted}
            multiline
            textAlignVertical="top"
            autoFocus
            testID="journal-input"
          />

          <Text style={styles.tagsLabel}>Tags (optional)</Text>
          <View style={styles.tagsRow}>
            {JOURNAL_TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]}
                onPress={() => handleToggleTag(tag)}
              >
                <Text style={[styles.tagChipText, selectedTags.includes(tag) && styles.tagChipTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, !journalText.trim() && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!journalText.trim() || isSaving}
            activeOpacity={0.7}
            testID="save-journal"
          >
            <Send size={18} color={Colors.white} />
            <Text style={styles.saveBtnText}>Save Entry</Text>
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
          testID="close-journal"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Identity Journal</Text>
          <Text style={styles.headerSubtitle}>Reflect on who you are</Text>
        </View>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.introCard}>
            <Text style={styles.introEmoji}>📖</Text>
            <Text style={styles.introText}>
              Identity journaling helps build a more stable sense of self. Write from wherever you are right now.
            </Text>
          </View>

          {entries.length > 0 && (
            <TouchableOpacity
              style={styles.entriesToggle}
              onPress={() => setShowEntries(!showEntries)}
            >
              <Text style={styles.entriesToggleText}>
                {entries.length} journal entr{entries.length !== 1 ? 'ies' : 'y'}
              </Text>
              {showEntries ? (
                <ChevronUp size={16} color={Colors.primary} />
              ) : (
                <ChevronDown size={16} color={Colors.primary} />
              )}
            </TouchableOpacity>
          )}

          {showEntries && entries.map((entry) => {
            const isExpanded = expandedEntry === entry.id;
            return (
              <View key={entry.id} style={styles.entryCard}>
                <TouchableOpacity
                  style={styles.entryHeader}
                  onPress={() => setExpandedEntry(isExpanded ? null : entry.id)}
                >
                  <View style={styles.entryHeaderLeft}>
                    <Text style={styles.entryPrompt} numberOfLines={isExpanded ? 3 : 1}>
                      {entry.promptText}
                    </Text>
                    <Text style={styles.entryDate}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={16} color={Colors.textMuted} />
                  ) : (
                    <ChevronDown size={16} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.entryBody}>
                    <Text style={styles.entryContent}>{entry.content}</Text>
                    {entry.tags.length > 0 && (
                      <View style={styles.entryTags}>
                        {entry.tags.map(tag => (
                          <View key={tag} style={styles.entryTagChip}>
                            <Text style={styles.entryTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <View style={styles.entryActions}>
                      <TouchableOpacity
                        onPress={() => toggleFavorite(entry.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Heart
                          size={18}
                          color={entry.isFavorite ? '#E84393' : Colors.textMuted}
                          fill={entry.isFavorite ? '#E84393' : 'none'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => remove(entry.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={18} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          <Text style={styles.sectionTitle}>Prompts</Text>

          {Object.entries(CATEGORY_LABELS).map(([cat, meta]) => {
            const prompts = IDENTITY_JOURNAL_PROMPTS.filter(p => p.category === cat);
            if (prompts.length === 0) return null;
            return (
              <View key={cat} style={styles.promptGroup}>
                <View style={[styles.promptGroupHeader, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.promptGroupLabel, { color: meta.color }]}>{meta.label}</Text>
                </View>
                {prompts.map(prompt => (
                  <TouchableOpacity
                    key={prompt.id}
                    style={styles.promptCard}
                    onPress={() => handleSelectPrompt(prompt)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.promptDot, { backgroundColor: meta.color }]} />
                    <Text style={styles.promptCardText}>{prompt.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
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
    paddingTop: 16,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#C8DDD2',
    marginBottom: 20,
  },
  introEmoji: {
    fontSize: 24,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 21,
  },
  entriesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 6,
  },
  entriesToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  entryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
    overflow: 'hidden',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  entryHeaderLeft: {
    flex: 1,
  },
  entryPrompt: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  entryBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  entryContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  entryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  entryTagChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  entryTagText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 4,
  },
  promptGroup: {
    marginBottom: 16,
  },
  promptGroupHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  promptGroupLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  promptDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  promptCardText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  journalSessionContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  journalPromptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C8DDD2',
  },
  journalPromptText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 26,
  },
  journalInput: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 200,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  tagsLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 24,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tagChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  tagChipTextActive: {
    color: Colors.primary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
