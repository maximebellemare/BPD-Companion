import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  EyeOff,
  Eye,
  AlertTriangle,
  Check,
  Shield,
  Sparkles,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { CATEGORIES, SITUATION_TAGS, SUPPORT_TYPES, EMOTION_OPTIONS, SUPPORT_REQUEST_TYPES, PRIMARY_EMOTIONS } from '@/constants/community';
import { useCreatePost } from '@/hooks/useCommunityFeed';
import { PostCategory, SituationTag, SupportRequestType } from '@/types/community';
import { checkContentSafety, getPostSuggestions } from '@/services/community/communitySafetyService';
import { getDistressLabel, trackEmotionalContextEvent } from '@/services/community/communityEmotionalContextService';
import { CommunityProfile, loadCommunityProfile } from '@/services/community/communityProfileService';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

export default function NewPostScreen() {
  useLanguage();
  const router = useRouter();
  const { createPost, isCreating } = useCreatePost();
  const [communityProfile, setCommunityProfile] = useState<CommunityProfile | null>(null);

  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [category, setCategory] = useState<PostCategory | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [hasContentWarning, setHasContentWarning] = useState<boolean>(false);
  const [contentWarningText, setContentWarningText] = useState<string>('');
  const [situationTag, setSituationTag] = useState<SituationTag | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [supportType, setSupportType] = useState<string | null>(null);
  const [showEmotions, setShowEmotions] = useState<boolean>(false);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [primaryEmotion, setPrimaryEmotion] = useState<string | null>(null);
  const [distressLevel, setDistressLevel] = useState<number | null>(null);
  const [supportRequestType, setSupportRequestType] = useState<SupportRequestType | null>(null);
  const [showEmotionalContext, setShowEmotionalContext] = useState<boolean>(false);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && category !== null;

  useEffect(() => {
    let mounted = true;
    loadCommunityProfile()
      .then((profile) => {
        if (mounted) setCommunityProfile(profile);
      })
      .catch(() => {
        if (mounted) setCommunityProfile(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const suggestions = useMemo(
    () => getPostSuggestions(title, body),
    [title, body]
  );

  const handleBodyChange = useCallback((text: string) => {
    setBody(text);
    if (text.length > 20) {
      const safety = checkContentSafety(text);
      if (!safety.isSafe && safety.suggestion) {
        setSafetyWarning(safety.suggestion);
      } else {
        setSafetyWarning(null);
      }
    } else {
      setSafetyWarning(null);
    }
  }, []);

  const toggleEmotion = useCallback((emotion: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    );
  }, []);

  const hasEmotionalContext = primaryEmotion !== null || distressLevel !== null || supportRequestType !== null;

  const doSubmit = useCallback(async () => {
    if (!category) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const emotionalContext = hasEmotionalContext ? {
        primaryEmotion: primaryEmotion ?? undefined,
        distressLevel: distressLevel ?? undefined,
        supportRequestType: supportRequestType ?? undefined,
      } : undefined;

      await createPost({
        title: title.trim(),
        body: body.trim(),
        category,
        isAnonymous,
        hasContentWarning,
        contentWarningText: hasContentWarning ? contentWarningText.trim() : undefined,
        situationTag: situationTag ?? undefined,
        emotions: selectedEmotions.length > 0 ? selectedEmotions : undefined,
        supportType: supportType ?? undefined,
        emotionalContext,
      });

      if (emotionalContext) {
        void trackEmotionalContextEvent('community_post_emotion_tagged', {
          primaryEmotion,
          distressLevel,
          supportRequestType,
        });
      }

      console.log('[NewPost] Post created successfully');
      router.back();
    } catch (error) {
      console.error('[NewPost] Failed to create post:', error);
      Alert.alert(localizedText('Could not share post', 'No se pudo compartir la publicación'), error instanceof Error ? error.message : localizedText('Please try again in a moment.', 'Intenta de nuevo en un momento.'));
    }
  }, [category, title, body, isAnonymous, hasContentWarning, contentWarningText, situationTag, selectedEmotions, supportType, createPost, router, primaryEmotion, distressLevel, supportRequestType, hasEmotionalContext]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(localizedText('Add a title', 'Agrega un título'), localizedText('Give your post a short title so people know what you need.', 'Dale a tu publicación un título breve para que las personas sepan qué necesitas.'));
      return;
    }
    if (!body.trim()) {
      Alert.alert(localizedText('Write your post', 'Escribe tu publicación'), localizedText('Share a little about what is going on before posting.', 'Comparte un poco de lo que está pasando antes de publicar.'));
      return;
    }
    if (!category) {
      Alert.alert(localizedText('Choose a category', 'Elige una categoría'), localizedText('Pick the category that best fits your post.', 'Elige la categoría que mejor se ajuste a tu publicación.'));
      return;
    }

    const safety = checkContentSafety(body);
    if (!safety.isSafe) {
      Alert.alert(
        localizedText('A gentle reminder', 'Un recordatorio amable'),
        safety.suggestion ?? localizedText('Please review your message before posting.', 'Revisa tu mensaje antes de publicar.'),
        [
          { text: localizedText('Edit post', 'Editar publicación'), style: 'cancel' },
          {
            text: localizedText('Post anyway', 'Publicar de todos modos'),
            onPress: async () => {
              await doSubmit();
            },
          },
        ]
      );
      return;
    }

    await doSubmit();
  }, [category, title, body, doSubmit]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{localizedText('New Post', 'Nueva publicación')}</Text>
          <TouchableOpacity
            style={[styles.submitBtn, canSubmit && styles.submitBtnActive]}
            onPress={handleSubmit}
            disabled={isCreating}
            testID="submit-btn"
          >
            {isCreating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={[styles.submitText, canSubmit && styles.submitTextActive]}>{localizedText('Share', 'Compartir')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.safeNotice}>
            <Shield size={14} color={Colors.primary} />
            <Text style={styles.safeNoticeText}>
              {localizedText('This is a safe space. Share what feels right for you.', 'Este es un espacio seguro. Comparte lo que se sienta bien para ti.')}
            </Text>
          </View>

          {!communityProfile && (
            <TouchableOpacity
              style={styles.profilePrompt}
              onPress={() => router.push('/(tabs)/profile' as never)}
              activeOpacity={0.78}
              testID="community-profile-prompt"
            >
              <Sparkles size={17} color={Colors.primary} />
              <View style={styles.profilePromptText}>
                <Text style={styles.profilePromptTitle}>{localizedText('Optional community profile', 'Perfil comunitario opcional')}</Text>
                <Text style={styles.profilePromptBody}>{localizedText('Add a username when you want. You can still post now.', 'Agrega un nombre de usuario cuando quieras. Igual puedes publicar ahora.')}</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggle, isAnonymous && styles.toggleActive]}
              onPress={() => {
                setIsAnonymous((prev) => !prev);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              testID="anon-toggle"
            >
              {isAnonymous ? <EyeOff size={16} color={Colors.primary} /> : <Eye size={16} color={Colors.textMuted} />}
              <Text style={[styles.toggleText, isAnonymous && styles.toggleTextActive]}>
                {isAnonymous ? localizedText('Posting anonymously', 'Publicando anónimamente') : localizedText('Posting as you', 'Publicando como tú')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggle, hasContentWarning && styles.toggleWarningActive]}
              onPress={() => {
                setHasContentWarning((prev) => !prev);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              testID="cw-toggle"
            >
              <AlertTriangle size={16} color={hasContentWarning ? Colors.accent : Colors.textMuted} />
              <Text style={[styles.toggleText, hasContentWarning && { color: Colors.accent }]}>CW</Text>
            </TouchableOpacity>
          </View>

          {hasContentWarning && (
            <TextInput
              style={styles.cwInput}
              placeholder={localizedText('What should readers be aware of?', '¿Qué deberían saber quienes lean?')}
              placeholderTextColor={Colors.textMuted}
              value={contentWarningText}
              onChangeText={setContentWarningText}
              maxLength={100}
              testID="cw-text-input"
            />
          )}

          <Text style={styles.sectionLabel}>{localizedText("What's the situation?", '¿Cuál es la situación?')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsRow}
            style={styles.tagsScroll}
          >
            {SITUATION_TAGS.map((tag) => {
              const isSelected = situationTag === tag.id;
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[styles.tagPill, isSelected && styles.tagPillActive]}
                  onPress={() => {
                    setSituationTag(isSelected ? null : tag.id);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionLabel}>{localizedText('What kind of support would help?', '¿Qué tipo de apoyo ayudaría?')}</Text>
          <View style={styles.supportGrid}>
            {SUPPORT_TYPES.map((st) => {
              const isSelected = supportType === st.id;
              return (
                <TouchableOpacity
                  key={st.id}
                  style={[styles.supportOption, isSelected && styles.supportOptionActive]}
                  onPress={() => {
                    setSupportType(isSelected ? null : st.id);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.supportEmoji}>{st.emoji}</Text>
                  <Text style={[styles.supportText, isSelected && styles.supportTextActive]}>{st.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>{localizedText('Category', 'Categoría')}</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    isSelected && { backgroundColor: cat.color + '18', borderColor: cat.color },
                  ]}
                  onPress={() => {
                    setCategory(cat.id);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  testID={`category-${cat.id}`}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryText, isSelected && { color: cat.color, fontWeight: '600' as const }]}>
                    {cat.label}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: cat.color }]}>
                      <Check size={10} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>{localizedText('Title', 'Título')}</Text>
          <TextInput
            style={styles.titleInput}
            placeholder={localizedText('Give your post a title...', 'Dale un título a tu publicación...')}
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={150}
            testID="title-input"
          />
          <Text style={styles.charCount}>{title.length}/150</Text>

          <Text style={styles.sectionLabel}>{localizedText('Your thoughts', 'Tus pensamientos')}</Text>
          <TextInput
            style={styles.bodyInput}
            placeholder={localizedText("Share what's on your mind. This community understands.", 'Comparte lo que tienes en mente. Esta comunidad entiende.')}
            placeholderTextColor={Colors.textMuted}
            value={body}
            onChangeText={handleBodyChange}
            multiline
            textAlignVertical="top"
            maxLength={3000}
            testID="body-input"
          />
          <Text style={styles.charCount}>{body.length}/3000</Text>

          {safetyWarning && (
            <View style={styles.safetyWarningCard}>
              <Shield size={14} color={Colors.accent} />
              <Text style={styles.safetyWarningText}>{safetyWarning}</Text>
              <TouchableOpacity onPress={() => setSafetyWarning(null)}>
                <X size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {suggestions.length > 0 && body.length > 10 && (
            <View style={styles.suggestionsCard}>
              <View style={styles.suggestionsHeader}>
                <Sparkles size={14} color={Colors.brandLilac} />
                <Text style={styles.suggestionsTitle}>{localizedText('Suggestions', 'Sugerencias')}</Text>
              </View>
              {suggestions.map((s, idx) => (
                <Text key={idx} style={styles.suggestionText}>• {s.message}</Text>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.emotionToggle}
            onPress={() => setShowEmotions(!showEmotions)}
          >
            <Text style={styles.emotionToggleText}>
              {showEmotions ? localizedText('Hide emotions', 'Ocultar emociones') : localizedText(`Add emotions${selectedEmotions.length > 0 ? ` (${selectedEmotions.length})` : ''}`, `Agregar emociones${selectedEmotions.length > 0 ? ` (${selectedEmotions.length})` : ''}`)}
            </Text>
          </TouchableOpacity>

          {showEmotions && (
            <View style={styles.emotionsGrid}>
              {EMOTION_OPTIONS.map((emotion) => {
                const isSelected = selectedEmotions.includes(emotion);
                return (
                  <TouchableOpacity
                    key={emotion}
                    style={[styles.emotionChip, isSelected && styles.emotionChipActive]}
                    onPress={() => toggleEmotion(emotion)}
                  >
                    <Text style={[styles.emotionChipText, isSelected && styles.emotionChipTextActive]}>
                      {emotion}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={styles.emotionalContextToggle}
            onPress={() => {
              setShowEmotionalContext(!showEmotionalContext);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.emotionalContextToggleLeft}>
              <Text style={styles.emotionalContextToggleEmoji}>🫧</Text>
              <View>
                <Text style={styles.emotionalContextToggleTitle}>
                  {showEmotionalContext ? localizedText('Hide emotional context', 'Ocultar contexto emocional') : localizedText('Add emotional context', 'Agregar contexto emocional')}
                </Text>
                <Text style={styles.emotionalContextToggleDesc}>{localizedText('Optional — helps others respond supportively', 'Opcional: ayuda a que otras personas respondan con apoyo')}</Text>
              </View>
            </View>
            {hasEmotionalContext && !showEmotionalContext && (
              <View style={styles.contextAddedBadge}>
                <Check size={10} color={Colors.primary} />
              </View>
            )}
          </TouchableOpacity>

          {showEmotionalContext && (
            <View style={styles.emotionalContextSection}>
              <Text style={styles.contextSectionLabel}>{localizedText('How are you feeling right now?', '¿Cómo te sientes ahora mismo?')}</Text>
              <View style={styles.primaryEmotionGrid}>
                {PRIMARY_EMOTIONS.map((emotion) => {
                  const isSelected = primaryEmotion === emotion.id;
                  return (
                    <TouchableOpacity
                      key={emotion.id}
                      style={[styles.primaryEmotionChip, isSelected && styles.primaryEmotionChipActive]}
                      onPress={() => {
                        setPrimaryEmotion(isSelected ? null : emotion.id);
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.primaryEmotionEmoji}>{emotion.emoji}</Text>
                      <Text style={[styles.primaryEmotionText, isSelected && styles.primaryEmotionTextActive]}>
                        {emotion.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.contextSectionLabel}>{localizedText('Distress level', 'Nivel de malestar')}</Text>
              <View style={styles.distressRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                  const isSelected = distressLevel === level;
                  const distressInfo = getDistressLabel(level);
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.distressDot,
                        { backgroundColor: isSelected ? distressInfo.color : Colors.surface },
                        isSelected && { borderColor: distressInfo.color },
                      ]}
                      onPress={() => {
                        setDistressLevel(isSelected ? null : level);
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[styles.distressDotText, isSelected && { color: Colors.white }]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {distressLevel !== null && (
                <Text style={[styles.distressLabel, { color: getDistressLabel(distressLevel).color }]}>
                  {getDistressLabel(distressLevel).label}
                </Text>
              )}

              <Text style={styles.contextSectionLabel}>{localizedText('What kind of response would help?', '¿Qué tipo de respuesta ayudaría?')}</Text>
              <View style={styles.supportRequestGrid}>
                {SUPPORT_REQUEST_TYPES.map((type) => {
                  const isSelected = supportRequestType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.supportRequestOption, isSelected && styles.supportRequestOptionActive]}
                      onPress={() => {
                        setSupportRequestType(isSelected ? null : type.id);
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.supportRequestEmoji}>{type.emoji}</Text>
                      <View style={styles.supportRequestTextWrap}>
                        <Text style={[styles.supportRequestLabel, isSelected && styles.supportRequestLabelActive]}>
                          {type.label}
                        </Text>
                        <Text style={styles.supportRequestDesc}>{type.description}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  safeTop: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  submitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  submitBtnActive: {
    backgroundColor: Colors.primary,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  submitTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  safeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  safeNoticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '500' as const,
  },
  profilePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  profilePromptText: {
    flex: 1,
  },
  profilePromptTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  profilePromptBody: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary + '40',
  },
  toggleWarningActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent + '40',
  },
  toggleText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  toggleTextActive: {
    color: Colors.primaryDark,
  },
  cwInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 16,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, string>,
    }),
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  tagsScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  tagsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tagPillActive: {
    backgroundColor: Colors.warmGlow,
    borderColor: Colors.accent + '40',
  },
  tagEmoji: {
    fontSize: 14,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  tagTextActive: {
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  supportOptionActive: {
    backgroundColor: Colors.brandLilacSoft,
    borderColor: Colors.brandLilac + '40',
  },
  supportEmoji: {
    fontSize: 14,
  },
  supportText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  supportTextActive: {
    color: Colors.brandLilac,
    fontWeight: '600' as const,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  titleInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, string>,
    }),
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: 20,
  },
  bodyInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    minHeight: 140,
    marginBottom: 4,
    lineHeight: 22,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, string>,
    }),
  },
  safetyWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.accentLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  safetyWarningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.accent,
    lineHeight: 18,
  },
  suggestionsCard: {
    backgroundColor: Colors.brandLilacSoft,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.brandLilac,
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  emotionToggle: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 8,
  },
  emotionToggleText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  emotionChip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  emotionChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary + '40',
  },
  emotionChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  emotionChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  bottomSpacer: {
    height: 40,
  },
  emotionalContextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  emotionalContextToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emotionalContextToggleEmoji: {
    fontSize: 22,
  },
  emotionalContextToggleTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  emotionalContextToggleDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  contextAddedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionalContextSection: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  contextSectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    marginTop: 4,
  },
  primaryEmotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  primaryEmotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryEmotionChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary + '40',
  },
  primaryEmotionEmoji: {
    fontSize: 14,
  },
  primaryEmotionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  primaryEmotionTextActive: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  distressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 8,
  },
  distressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  distressDotText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  distressLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center',
    marginBottom: 16,
  },
  supportRequestGrid: {
    gap: 8,
    marginBottom: 8,
  },
  supportRequestOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  supportRequestOptionActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary + '40',
  },
  supportRequestEmoji: {
    fontSize: 18,
  },
  supportRequestTextWrap: {
    flex: 1,
  },
  supportRequestLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  supportRequestLabelActive: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  supportRequestDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
