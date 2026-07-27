import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  TextInput,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Users,
  Clock,
  Check,
  LogOut,
  Plus,
  MessageCircle,
  Award,
  Send,
  X,
  Heart,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import { useSupportCircles } from '@/hooks/useCommunityFeed';
import { useCirclePosts } from '@/hooks/useSupportCircles';
import { CIRCLE_POST_TYPES, SUPPORT_REACTION_LABELS } from '@/constants/community';
import { CirclePost, CirclePostType } from '@/types/community';

function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return localizedText('just now', 'ahora');
  if (minutes < 60) return localizedText(`${minutes}m ago`, `hace ${minutes} min`);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return localizedText(`${hours}h ago`, `hace ${hours} h`);
  const days = Math.floor(hours / 24);
  if (days < 7) return localizedText(`${days}d ago`, `hace ${days} d`);
  return localizedText(`${Math.floor(days / 7)}w ago`, `hace ${Math.floor(days / 7)} sem`);
}

const CirclePostCard = React.memo(function CirclePostCard({ post, onPress }: { post: CirclePost; onPress: () => void }) {
  const postType = CIRCLE_POST_TYPES.find((t) => t.id === post.type);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const totalReactions = useMemo(
    () => post.supportReactions.reduce((sum, r) => sum + r.count, 0),
    [post.supportReactions]
  );

  return (
    <Animated.View style={[styles.circlePostCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`circle-post-${post.id}`}
      >
        <View style={styles.circlePostHeader}>
          {postType && (
            <View style={[styles.postTypeBadge, { backgroundColor: postType.color + '15' }]}>
              <Text style={styles.postTypeEmoji}>{postType.emoji}</Text>
              <Text style={[styles.postTypeLabel, { color: postType.color }]}>{postType.label}</Text>
            </View>
          )}
          <Text style={styles.circlePostTime}>{timeAgo(post.createdAt)}</Text>
        </View>

        <Text style={styles.circlePostTitle}>{post.title}</Text>
        <Text style={styles.circlePostBody} numberOfLines={3}>{post.body}</Text>

        <View style={styles.circlePostMeta}>
          <View style={styles.authorRow}>
            {post.author.isTrustedHelper && (
              <View style={styles.trustedBadge}>
                <Award size={9} color={Colors.primary} />
              </View>
            )}
            <Text style={styles.authorName}>
              {post.author.isAnonymous ? '🫧 Anonymous' : post.author.displayName}
            </Text>
          </View>
        </View>

        <View style={styles.circlePostFooter}>
          <View style={styles.reactionsRow}>
            {post.supportReactions.filter(r => r.count > 0).slice(0, 3).map((reaction) => {
              const info = SUPPORT_REACTION_LABELS[reaction.type];
              if (!info) return null;
              return (
                <View key={reaction.type} style={styles.reactionChip}>
                  <Text style={styles.reactionEmoji}>{info.emoji}</Text>
                  <Text style={styles.reactionCount}>{reaction.count}</Text>
                </View>
              );
            })}
            {totalReactions === 0 && (
              <View style={styles.reactionChip}>
                <Heart size={12} color={Colors.textMuted} />
                <Text style={styles.reactionCount}>0</Text>
              </View>
            )}
          </View>
          <View style={styles.replyInfo}>
            <MessageCircle size={13} color={Colors.textMuted} />
            <Text style={styles.replyCount}>{post.replyCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function CircleDetailScreen() {
  useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { circles, isLoading, joinCircle, leaveCircle, isJoining, isLeaving } = useSupportCircles();
  const { posts: circlePosts, isLoading: postsLoading, createPost, isCreating } = useCirclePosts(id ?? '');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showComposer, setShowComposer] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newBody, setNewBody] = useState<string>('');
  const [selectedType, setSelectedType] = useState<CirclePostType>('update');

  const circle = circles.find((c) => c.id === id);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleToggleJoin = useCallback(() => {
    if (!circle) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (circle.isJoined) {
      leaveCircle(circle.id);
    } else {
      joinCircle(circle.id);
    }
  }, [circle, joinCircle, leaveCircle]);

  const handleSubmitPost = useCallback(() => {
    if (!newTitle.trim() || !newBody.trim()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    createPost({ title: newTitle.trim(), body: newBody.trim(), type: selectedType });
    setNewTitle('');
    setNewBody('');
    setSelectedType('update');
    setShowComposer(false);
  }, [newTitle, newBody, selectedType, createPost]);

  const handleOpenThread = useCallback((postId: string) => {
    router.push(`/community/circle-thread?circleId=${id}&postId=${postId}` as never);
  }, [id, router]);

  if (isLoading || !circle) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.navBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>{localizedText('Circle', 'Círculo')}</Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{circle.name}</Text>
          {circle.isJoined ? (
            <TouchableOpacity style={styles.composeBtn} onPress={() => setShowComposer(true)} testID="compose-btn">
              <Plus size={18} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.heroCard, { opacity: fadeAnim, borderColor: circle.color + '30' }]}>
          <View style={[styles.heroEmojiCircle, { backgroundColor: circle.color + '15' }]}>
            <Text style={styles.heroEmoji}>{circle.emoji}</Text>
          </View>
          <Text style={styles.heroName}>{circle.name}</Text>
          <Text style={styles.heroDescription}>{circle.description}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Users size={14} color={Colors.textMuted} />
              <Text style={styles.heroStatText}>{circle.memberCount} members</Text>
            </View>
            <View style={styles.heroStatDot} />
            <View style={styles.heroStat}>
              <Clock size={14} color={Colors.textMuted} />
              <Text style={styles.heroStatText}>Active {timeAgo(circle.recentActivity)}</Text>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {circle.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: circle.color + '12' }]}>
                <Text style={[styles.tagText, { color: circle.color }]}>{tag}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.joinBtn,
              circle.isJoined
                ? { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight }
                : { backgroundColor: circle.color },
            ]}
            onPress={handleToggleJoin}
            disabled={isJoining || isLeaving}
            testID="join-btn"
          >
            {isJoining || isLeaving ? (
              <ActivityIndicator size="small" color={circle.isJoined ? Colors.textMuted : Colors.white} />
            ) : circle.isJoined ? (
              <View style={styles.joinBtnContent}>
                <LogOut size={16} color={Colors.textSecondary} />
                <Text style={styles.leaveBtnText}>Leave circle</Text>
              </View>
            ) : (
              <View style={styles.joinBtnContent}>
                <Check size={16} color={Colors.white} />
                <Text style={styles.joinBtnText}>Join circle</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {circle.isJoined ? (
          <>
            <View style={styles.sectionHeader}>
              <Sparkles size={16} color={circle.color} />
              <Text style={styles.sectionTitle}>{localizedText('Circle discussions', 'Conversaciones del círculo')}</Text>
            </View>

            {postsLoading ? (
              <View style={styles.loadingPosts}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : circlePosts.length > 0 ? (
              circlePosts.map((post) => (
                <CirclePostCard key={post.id} post={post} onPress={() => handleOpenThread(post.id)} />
              ))
            ) : (
              <View style={styles.emptyDiscussions}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyTitle}>{localizedText('Start the conversation', 'Inicia la conversación')}</Text>
                <Text style={styles.emptyText}>
                  Share an update, ask a question, or celebrate progress with your circle.
                </Text>
                <TouchableOpacity
                  style={[styles.startConvoBtn, { backgroundColor: circle.color }]}
                  onPress={() => setShowComposer(true)}
                >
                  <Plus size={16} color={Colors.white} />
                  <Text style={styles.startConvoBtnText}>New post</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>{localizedText('About this circle', 'Sobre este círculo')}</Text>
              <View style={styles.aboutCard}>
                <Text style={styles.aboutItem}>🤝 A safe space for peer support</Text>
                <Text style={styles.aboutItem}>🔒 Respectful and confidential</Text>
                <Text style={styles.aboutItem}>💛 Focused discussions on shared experiences</Text>
                <Text style={styles.aboutItem}>🫂 Smaller group, deeper connection</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.notJoinedSection}>
            <View style={styles.benefitsCard}>
              <Text style={styles.benefitsTitle}>{localizedText('Why join this circle?', '¿Por qué unirte a este círculo?')}</Text>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitEmoji}>🫂</Text>
                <View style={styles.benefitTextWrap}>
                  <Text style={styles.benefitLabel}>Smaller, safer space</Text>
                  <Text style={styles.benefitDesc}>Connect with others who share similar experiences in a focused group.</Text>
                </View>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitEmoji}>💬</Text>
                <View style={styles.benefitTextWrap}>
                  <Text style={styles.benefitLabel}>Focused discussions</Text>
                  <Text style={styles.benefitDesc}>Conversations stay on topic and feel more relevant to your experience.</Text>
                </View>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitEmoji}>🌱</Text>
                <View style={styles.benefitTextWrap}>
                  <Text style={styles.benefitLabel}>Grow together</Text>
                  <Text style={styles.benefitDesc}>Learn from others who are working through similar challenges.</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={showComposer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComposer(false)}
      >
        <KeyboardAvoidingView
          style={styles.composerContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView edges={['top']} style={styles.composerSafe}>
            <View style={styles.composerHeader}>
              <TouchableOpacity onPress={() => setShowComposer(false)} testID="close-composer">
                <X size={22} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.composerTitle}>{localizedText('New post', 'Nueva publicación')}</Text>
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!newTitle.trim() || !newBody.trim()) && styles.sendBtnDisabled,
                ]}
                onPress={handleSubmitPost}
                disabled={!newTitle.trim() || !newBody.trim() || isCreating}
                testID="send-post-btn"
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Send size={16} color={Colors.white} />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.composerBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.composerLabel}>{localizedText('Post type', 'Tipo de publicación')}</Text>
              <View style={styles.typeRow}>
                {CIRCLE_POST_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeChip,
                      selectedType === type.id && { backgroundColor: type.color + '18', borderColor: type.color },
                    ]}
                    onPress={() => setSelectedType(type.id)}
                  >
                    <Text style={styles.typeChipEmoji}>{type.emoji}</Text>
                    <Text style={[styles.typeChipLabel, selectedType === type.id && { color: type.color, fontWeight: '600' as const }]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.composerLabel}>{localizedText('Title', 'Título')}</Text>
              <TextInput
                style={styles.titleInput}
                placeholder={localizedText("What's on your mind?", '¿Qué tienes en mente?')}
                placeholderTextColor={Colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
                maxLength={120}
                testID="post-title-input"
              />

              <Text style={styles.composerLabel}>{localizedText('Details', 'Detalles')}</Text>
              <TextInput
                style={styles.bodyInput}
                placeholder={localizedText('Share your thoughts...', 'Comparte lo que piensas...')}
                placeholderTextColor={Colors.textMuted}
                value={newBody}
                onChangeText={setNewBody}
                multiline
                textAlignVertical="top"
                maxLength={2000}
                testID="post-body-input"
              />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  composeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 20,
  },
  heroEmojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroEmoji: {
    fontSize: 36,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroStatText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  heroStatDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  joinBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    minWidth: 160,
    alignItems: 'center',
  },
  joinBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  leaveBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  loadingPosts: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  circlePostCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  circlePostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  postTypeEmoji: {
    fontSize: 11,
  },
  postTypeLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  circlePostTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  circlePostTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 6,
  },
  circlePostBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  circlePostMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  circlePostFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  replyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  emptyDiscussions: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 19,
    marginBottom: 16,
  },
  startConvoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startConvoBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  aboutSection: {
    marginBottom: 20,
    marginTop: 8,
  },
  aboutTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  aboutCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  aboutItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  notJoinedSection: {
    marginBottom: 20,
  },
  benefitsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  benefitsTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 18,
  },
  benefitRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  benefitEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  benefitDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  bottomSpacer: {
    height: 40,
  },
  composerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  composerSafe: {
    flex: 1,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  composerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  composerBody: {
    flex: 1,
    padding: 20,
  },
  composerLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  typeChipEmoji: {
    fontSize: 14,
  },
  typeChipLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  titleInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, string>,
    }),
  },
  bodyInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    minHeight: 140,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, string>,
    }),
  },
});
