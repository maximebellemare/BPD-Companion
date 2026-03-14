import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Plus,
  MessageCircle,
  Pin,
  Shield,
  ChevronRight,
  X,
  Heart,
  Users,
  Award,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { CATEGORIES, SUPPORT_REACTION_LABELS, SITUATION_TAGS } from '@/constants/community';
import { useCommunityFeed, useSupportCircles } from '@/hooks/useCommunityFeed';
import { CommunityPost, PostCategory, SupportCircle } from '@/types/community';
import { getRecommendedPosts } from '@/services/community/communityMatchingService';
import { getDistressLabel, getSupportRequestLabel } from '@/services/community/communityEmotionalContextService';

function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const PostCard = React.memo(function PostCard({ post, onPress }: { post: CommunityPost; onPress: () => void }) {
  const category = CATEGORIES.find((c) => c.id === post.category);
  const situationTag = SITUATION_TAGS.find((t) => t.id === post.situationTag);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const totalSupportReactions = useMemo(
    () => post.supportReactions.reduce((sum, r) => sum + r.count, 0),
    [post.supportReactions]
  );

  return (
    <Animated.View style={[styles.postCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`post-card-${post.id}`}
      >
        <View style={styles.postCardHeader}>
          {post.isPinned && (
            <View style={styles.pinnedBadge}>
              <Pin size={10} color={Colors.primary} />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          )}
          {category && (
            <View style={[styles.categoryChip, { backgroundColor: category.color + '18' }]}>
              <Text style={styles.categoryChipEmoji}>{category.emoji}</Text>
              <Text style={[styles.categoryChipText, { color: category.color }]}>
                {category.label}
              </Text>
            </View>
          )}
          {situationTag && (
            <View style={styles.situationChip}>
              <Text style={styles.situationChipText}>{situationTag.emoji} {situationTag.label}</Text>
            </View>
          )}
        </View>

        <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>

        {post.hasContentWarning && (
          <View style={styles.contentWarning}>
            <Shield size={12} color={Colors.accent} />
            <Text style={styles.contentWarningText}>
              Content warning{post.contentWarningText ? `: ${post.contentWarningText}` : ''}
            </Text>
          </View>
        )}

        {!post.hasContentWarning && (
          <Text style={styles.postPreview} numberOfLines={2}>{post.body}</Text>
        )}

        {post.emotionalContext && (
          <View style={styles.ecRow}>
            {post.emotionalContext.primaryEmotion && (
              <View style={styles.ecMiniChip}>
                <Text style={styles.ecMiniChipText}>{post.emotionalContext.primaryEmotion}</Text>
              </View>
            )}
            {post.emotionalContext.distressLevel != null && (
              <View style={[styles.ecMiniChip, { backgroundColor: getDistressLabel(post.emotionalContext.distressLevel).color + '15' }]}>
                <Text style={[styles.ecMiniChipText, { color: getDistressLabel(post.emotionalContext.distressLevel).color }]}>
                  {getDistressLabel(post.emotionalContext.distressLevel).label}
                </Text>
              </View>
            )}
            {post.emotionalContext.supportRequestType && (
              <View style={[styles.ecMiniChip, { backgroundColor: '#F0ECF7' }]}>
                <Text style={[styles.ecMiniChipText, { color: '#9B8EC4' }]}>
                  {getSupportRequestLabel(post.emotionalContext.supportRequestType).emoji}{' '}
                  {getSupportRequestLabel(post.emotionalContext.supportRequestType).label}
                </Text>
              </View>
            )}
          </View>
        )}

        {post.supportType && !post.emotionalContext?.supportRequestType && (
          <View style={styles.supportTypeBadge}>
            <Text style={styles.supportTypeText}>
              {post.supportType === 'just-listening' ? '👂 Just listening' :
               post.supportType === 'advice' ? '💡 Looking for advice' :
               post.supportType === 'shared-experience' ? '🤝 Shared experiences' :
               post.supportType === 'encouragement' ? '💪 Encouragement' :
               '🧠 Skill help'}
            </Text>
          </View>
        )}

        <View style={styles.postMeta}>
          <View style={styles.authorRow}>
            {post.author.isTrustedHelper && (
              <View style={styles.trustedBadge}>
                <Award size={10} color={Colors.primary} />
              </View>
            )}
            <Text style={styles.postAuthor}>
              {post.author.isAnonymous ? '🫧 Anonymous' : post.author.displayName}
            </Text>
          </View>
          <Text style={styles.postDot}>·</Text>
          <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
        </View>

        <View style={styles.postFooter}>
          <View style={styles.reactionsRow}>
            {post.supportReactions.slice(0, 3).filter(r => r.count > 0).map((reaction) => {
              const info = SUPPORT_REACTION_LABELS[reaction.type];
              if (!info) return null;
              return (
                <View
                  key={reaction.type}
                  style={[styles.reactionMini, reaction.userReacted && styles.reactionMiniActive]}
                >
                  <Text style={styles.reactionMiniEmoji}>{info.emoji}</Text>
                  <Text style={[styles.reactionMiniCount, reaction.userReacted && styles.reactionMiniCountActive]}>
                    {reaction.count}
                  </Text>
                </View>
              );
            })}
            {totalSupportReactions === 0 && post.reactions.slice(0, 3).filter(r => r.count > 0).map((reaction) => {
              const labels: Record<string, string> = { heart: '💛', hug: '🤗', strength: '💪', seen: '👁', relate: '🤝' };
              return (
                <View key={reaction.type} style={[styles.reactionMini, reaction.userReacted && styles.reactionMiniActive]}>
                  <Text style={styles.reactionMiniEmoji}>{labels[reaction.type] ?? '💛'}</Text>
                  <Text style={[styles.reactionMiniCount, reaction.userReacted && styles.reactionMiniCountActive]}>
                    {reaction.count}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.replyCount}>
            <MessageCircle size={13} color={Colors.textMuted} />
            <Text style={styles.replyCountText}>{post.replyCount}</Text>
          </View>
        </View>

        {post.suggestedToolName && (
          <View style={styles.toolSuggestion}>
            <Sparkles size={12} color={Colors.primary} />
            <Text style={styles.toolSuggestionText}>Related: {post.suggestedToolName}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

function CircleCard({ circle, onPress }: { circle: SupportCircle; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.circleCard, { borderColor: circle.color + '40' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.circleEmoji}>{circle.emoji}</Text>
      <Text style={styles.circleName} numberOfLines={1}>{circle.name}</Text>
      <Text style={styles.circleMembers}>{circle.memberCount} members</Text>
      {circle.isJoined && (
        <View style={[styles.joinedBadge, { backgroundColor: circle.color + '20' }]}>
          <Text style={[styles.joinedText, { color: circle.color }]}>Joined</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function CommunityFeedScreen() {
  const router = useRouter();
  const {
    posts,
    isLoading,
    isRefetching,
    refetch,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useCommunityFeed();
  const { circles } = useSupportCircles();
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<'feed' | 'circles'>('feed');
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const recommendedPosts = useMemo(
    () => getRecommendedPosts(posts, {}, 3),
    [posts]
  );

  const handleCategoryPress = useCallback(
    (cat: PostCategory) => {
      setSelectedCategory(selectedCategory === cat ? null : cat);
    },
    [selectedCategory, setSelectedCategory]
  );

  const handleToggleSearch = useCallback(() => {
    setShowSearch((prev) => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, [setSearchQuery]);

  const handlePostPress = useCallback(
    (postId: string) => {
      router.push(`/community/post-detail?id=${postId}` as never);
    },
    [router]
  );

  const handleNewPost = useCallback(() => {
    router.push('/community/new-post' as never);
  }, [router]);

  const handleGuidelines = useCallback(() => {
    router.push('/community/guidelines' as never);
  }, [router]);

  const handleCirclePress = useCallback(
    (circleId: string) => {
      router.push(`/community/circle-detail?id=${circleId}` as never);
    },
    [router]
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.headerSubtitle}>A safe space to connect</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={handleToggleSearch} testID="search-toggle">
              {showSearch ? <X size={20} color={Colors.text} /> : <Search size={20} color={Colors.text} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.newPostBtn} onPress={handleNewPost} testID="new-post-btn">
              <Plus size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchBar}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search posts..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              testID="search-input"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'feed' && styles.sectionTabActive]}
            onPress={() => setActiveSection('feed')}
          >
            <MessageCircle size={14} color={activeSection === 'feed' ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.sectionTabText, activeSection === 'feed' && styles.sectionTabTextActive]}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'circles' && styles.sectionTabActive]}
            onPress={() => setActiveSection('circles')}
          >
            <Users size={14} color={activeSection === 'circles' ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.sectionTabText, activeSection === 'circles' && styles.sectionTabTextActive]}>Circles</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
      >
        {activeSection === 'feed' ? (
          <>
            <TouchableOpacity
              style={styles.guidelinesCard}
              onPress={handleGuidelines}
              activeOpacity={0.7}
              testID="guidelines-btn"
            >
              <View style={styles.guidelinesLeft}>
                <Heart size={16} color={Colors.primary} />
                <Text style={styles.guidelinesText}>Community Guidelines</Text>
              </View>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            {recommendedPosts.length > 0 && !selectedCategory && !searchQuery && (
              <View style={styles.recommendedSection}>
                <View style={styles.sectionHeader}>
                  <TrendingUp size={16} color={Colors.brandAmber} />
                  <Text style={styles.sectionTitle}>Recommended for you</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendedRow}
                >
                  {recommendedPosts.map((post) => (
                    <TouchableOpacity
                      key={post.id}
                      style={styles.recommendedCard}
                      onPress={() => handlePostPress(post.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.recommendedTitle} numberOfLines={2}>{post.title}</Text>
                      <Text style={styles.recommendedPreview} numberOfLines={2}>{post.body}</Text>
                      <View style={styles.recommendedMeta}>
                        <Text style={styles.recommendedReactions}>
                          {post.supportReactions.reduce((s, r) => s + r.count, 0)} reactions
                        </Text>
                        <Text style={styles.recommendedDot}>·</Text>
                        <Text style={styles.recommendedReplies}>{post.replyCount} replies</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {circles.filter(c => c.isJoined).length > 0 && !selectedCategory && !searchQuery && (
              <View style={styles.myCirclesSection}>
                <View style={styles.sectionHeader}>
                  <Users size={16} color={Colors.brandLilac} />
                  <Text style={styles.sectionTitle}>My circles</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.circlesHorizontal}
                >
                  {circles.filter(c => c.isJoined).map((circle) => (
                    <TouchableOpacity
                      key={circle.id}
                      style={[styles.miniCircle, { backgroundColor: circle.color + '12' }]}
                      onPress={() => handleCirclePress(circle.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.miniCircleEmoji}>{circle.emoji}</Text>
                      <Text style={[styles.miniCircleName, { color: circle.color }]} numberOfLines={1}>
                        {circle.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
              style={styles.categoriesScroll}
            >
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryPill,
                      isActive && { backgroundColor: cat.color + '22', borderColor: cat.color },
                    ]}
                    onPress={() => handleCategoryPress(cat.id)}
                    testID={`category-${cat.id}`}
                  >
                    <Text style={styles.categoryPillEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.categoryPillText, isActive && { color: cat.color, fontWeight: '600' as const }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {isLoading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Loading posts...</Text>
              </View>
            )}

            {!isLoading && posts.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>🌿</Text>
                <Text style={styles.emptyStateTitle}>No posts yet</Text>
                <Text style={styles.emptyStateText}>
                  {selectedCategory || searchQuery
                    ? 'Try adjusting your filters or search'
                    : 'Be the first to share something'}
                </Text>
              </View>
            )}

            <Animated.View style={{ opacity: fadeAnim }}>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onPress={() => handlePostPress(post.id)} />
              ))}
            </Animated.View>
          </>
        ) : (
          <>
            <View style={styles.circlesIntro}>
              <Text style={styles.circlesIntroEmoji}>🫂</Text>
              <Text style={styles.circlesIntroTitle}>Support Circles</Text>
              <Text style={styles.circlesIntroText}>
                Smaller, focused groups where you can connect with others who share similar experiences.
              </Text>
            </View>

            {circles.map((circle) => (
              <CircleCard key={circle.id} circle={circle} onPress={() => handleCirclePress(circle.id)} />
            ))}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newPostBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, string>,
    }),
  },
  sectionTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 4,
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  sectionTabActive: {
    backgroundColor: Colors.primaryLight,
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  sectionTabTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  guidelinesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  guidelinesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guidelinesText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  recommendedSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  recommendedRow: {
    gap: 10,
  },
  recommendedCard: {
    width: 220,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  recommendedTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 19,
    marginBottom: 6,
  },
  recommendedPreview: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  recommendedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendedReactions: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  recommendedDot: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  recommendedReplies: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  myCirclesSection: {
    marginBottom: 14,
  },
  circlesHorizontal: {
    gap: 8,
  },
  miniCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  miniCircleEmoji: {
    fontSize: 14,
  },
  miniCircleName: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  categoriesScroll: {
    marginBottom: 8,
    marginHorizontal: -16,
  },
  categoriesRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  categoryPillEmoji: {
    fontSize: 14,
  },
  categoryPillText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  postCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  categoryChipEmoji: {
    fontSize: 11,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  situationChip: {
    backgroundColor: Colors.warmGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  situationChipText: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  contentWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  contentWarningText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  postPreview: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  supportTypeBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  supportTypeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAuthor: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  postDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  postTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  postFooter: {
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
  reactionMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reactionMiniActive: {
    backgroundColor: Colors.primaryLight,
  },
  reactionMiniEmoji: {
    fontSize: 12,
  },
  reactionMiniCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  reactionMiniCountActive: {
    color: Colors.primaryDark,
  },
  replyCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyCountText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  toolSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  toolSuggestionText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  circlesIntro: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  circlesIntroEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  circlesIntroTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  circlesIntroText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  circleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  circleEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  circleName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  circleMembers: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  joinedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  joinedText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  bottomSpacer: {
    height: 30,
  },
  ecRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8,
  },
  ecMiniChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ecMiniChipText: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: '500' as const,
  },
});
