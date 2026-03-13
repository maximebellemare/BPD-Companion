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
import { X, Send, Heart, Star, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSelfTrustPrompts } from '@/hooks/useIdentity';
import { SELF_TRUST_PROMPTS } from '@/services/identity/valuesService';
import type { SelfTrustPrompt } from '@/types/identity';

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  grounding: { color: '#6B9080', bg: '#E3EDE8' },
  clarity: { color: '#3B82F6', bg: '#E8F0FE' },
  'self-respect': { color: '#D4956A', bg: '#FFF8F0' },
  'future-self': { color: '#8B5CF6', bg: '#F0E6FF' },
  needs: { color: '#E84393', bg: '#FFF0F6' },
};

export default function SelfTrustPromptsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { responses, saveResponse, isSaving, toggleFavorite } = useSelfTrustPrompts();
  const [activePrompt, setActivePrompt] = useState<SelfTrustPrompt | null>(null);
  const [responseText, setResponseText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(SELF_TRUST_PROMPTS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const staggered = cardAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: i * 60,
        useNativeDriver: true,
      })
    );
    Animated.stagger(60, staggered).start();
  }, [fadeAnim, cardAnims]);

  const handleSelectPrompt = useCallback((prompt: SelfTrustPrompt) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActivePrompt(prompt);
    setResponseText('');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!activePrompt || !responseText.trim()) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    saveResponse({
      promptId: activePrompt.id,
      promptText: activePrompt.text,
      response: responseText.trim(),
    });
    setActivePrompt(null);
    setResponseText('');
  }, [activePrompt, responseText, saveResponse]);

  const favoriteResponses = responses.filter(r => r.isFavorite);

  if (activePrompt) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => { setActivePrompt(null); setResponseText(''); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Self-Trust Moment</Text>
          </View>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.promptSessionContent} keyboardShouldPersistTaps="handled">
          <View style={styles.promptSessionCard}>
            <View style={[
              styles.promptSessionBadge,
              { backgroundColor: CATEGORY_COLORS[activePrompt.category]?.bg ?? Colors.surface },
            ]}>
              <Star size={16} color={CATEGORY_COLORS[activePrompt.category]?.color ?? Colors.primary} />
            </View>
            <Text style={styles.promptSessionText}>{activePrompt.text}</Text>
          </View>

          <Text style={styles.promptSessionHint}>
            Write what feels true, even if it is just a few words.
          </Text>

          <TextInput
            style={styles.promptSessionInput}
            value={responseText}
            onChangeText={setResponseText}
            placeholder="What comes up for you..."
            placeholderTextColor={Colors.textMuted}
            multiline
            textAlignVertical="top"
            autoFocus
            testID="self-trust-input"
          />

          <TouchableOpacity
            style={[styles.submitBtn, !responseText.trim() && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!responseText.trim() || isSaving}
            activeOpacity={0.7}
            testID="submit-response"
          >
            <Send size={18} color={Colors.white} />
            <Text style={styles.submitBtnText}>Save Response</Text>
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
          testID="close-self-trust"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Self-Trust Prompts</Text>
          <Text style={styles.headerSubtitle}>Reconnect to what you know</Text>
        </View>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.introCard}>
            <Text style={styles.introEmoji}>🧭</Text>
            <Text style={styles.introText}>
              These prompts help you reconnect with your inner compass, especially during moments of doubt or emotional intensity.
            </Text>
          </View>

          {showHistory ? (
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.sectionTitle}>Your Responses</Text>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <Text style={styles.toggleLink}>Show prompts</Text>
                </TouchableOpacity>
              </View>
              {responses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No responses yet. Start by choosing a prompt above.</Text>
                </View>
              ) : (
                responses.map((r) => (
                  <View key={r.id} style={styles.responseCard}>
                    <Text style={styles.responsePrompt}>{r.promptText}</Text>
                    <Text style={styles.responseText}>{r.response}</Text>
                    <View style={styles.responseFooter}>
                      <Text style={styles.responseDate}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleFavorite(r.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Heart
                          size={16}
                          color={r.isFavorite ? '#E84393' : Colors.textMuted}
                          fill={r.isFavorite ? '#E84393' : 'none'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : (
            <>
              {responses.length > 0 && (
                <TouchableOpacity style={styles.historyToggle} onPress={() => setShowHistory(true)}>
                  <Text style={styles.historyToggleText}>
                    View {responses.length} past response{responses.length !== 1 ? 's' : ''}
                  </Text>
                  <ChevronRight size={16} color={Colors.primary} />
                </TouchableOpacity>
              )}

              {favoriteResponses.length > 0 && (
                <View style={styles.favoritesSection}>
                  <Text style={styles.sectionTitle}>Favorite Responses</Text>
                  {favoriteResponses.slice(0, 3).map((r) => (
                    <View key={r.id} style={styles.favoriteCard}>
                      <Heart size={14} color="#E84393" fill="#E84393" />
                      <View style={styles.favoriteContent}>
                        <Text style={styles.favoritePrompt}>{r.promptText}</Text>
                        <Text style={styles.favoriteResponse} numberOfLines={2}>{r.response}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.sectionTitle}>Choose a Prompt</Text>

              {SELF_TRUST_PROMPTS.map((prompt, index) => {
                const meta = CATEGORY_COLORS[prompt.category] ?? { color: Colors.primary, bg: Colors.primaryLight };
                return (
                  <Animated.View
                    key={prompt.id}
                    style={{
                      opacity: cardAnims[index],
                      transform: [{
                        translateY: cardAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [16, 0],
                        }),
                      }],
                    }}
                  >
                    <TouchableOpacity
                      style={styles.promptCard}
                      onPress={() => handleSelectPrompt(prompt)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.promptDot, { backgroundColor: meta.color }]} />
                      <Text style={styles.promptText}>{prompt.text}</Text>
                      <ChevronRight size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </>
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
    backgroundColor: '#F0E6FF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0D0F0',
    marginBottom: 20,
  },
  introEmoji: {
    fontSize: 24,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#6B5B8A',
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 6,
  },
  historyToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  promptDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  promptSessionContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  promptSessionCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  promptSessionBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  promptSessionText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  promptSessionHint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  promptSessionInput: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 160,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  historySection: {
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  responseCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  responsePrompt: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  responseText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  responseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  responseDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  favoritesSection: {
    marginBottom: 20,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF0F6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE0EC',
  },
  favoriteContent: {
    flex: 1,
  },
  favoritePrompt: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#C44D8E',
    marginBottom: 4,
  },
  favoriteResponse: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
});
