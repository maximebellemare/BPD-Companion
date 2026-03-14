import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Shield,
  Send,
  Pin,
  Eye,
  EyeOff,
  MoreHorizontal,
  Flag,
  Ban,
  X,
  Check,
  Award,
  Sparkles,
  Tag,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  CATEGORIES,
  SUPPORT_REACTION_LABELS,
  REPORT_REASONS,
  REPLY_LABEL_INFO,
  SITUATION_TAGS,
  RESPONSE_TYPES,
  HELPFULNESS_OPTIONS,
  CLOSURE_TYPES,
} from '@/constants/community';
import { usePostDetail } from '@/hooks/useCommunityFeed';
import { PostReply, SupportReaction, ReportReason, ReplyLabel, ResponseType, HelpfulnessRating, ThreadClosure } from '@/types/community';
import { getSuggestedTool } from '@/services/community/communityMatchingService';
import { checkContentSafety } from '@/services/community/communitySafetyService';
import {
  checkTone,
  getDistressLabel,
  getSupportRequestLabel,
  getResponseTypeLabel,
  getClosureTypeLabel,
  trackEmotionalContextEvent,
} from '@/services/community/communityEmotionalContextService';

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

function SupportReactionBar({
  reactions,
  onToggle,
}: {
  reactions: SupportReaction[];
  onToggle: (type: string) => void;
}) {
  return (
    <View style={styles.supportReactionBar}>
      {reactions.map((reaction) => {
        const info = SUPPORT_REACTION_LABELS[reaction.type];
        if (!info) return null;
        return (
          <TouchableOpacity
            key={reaction.type}
            style={[styles.supportReactionBtn, reaction.userReacted && styles.supportReactionBtnActive]}
            onPress={() => onToggle(reaction.type)}
            activeOpacity={0.7}
          >
            <Text style={styles.supportReactionEmoji}>{info.emoji}</Text>
            <Text style={[styles.supportReactionLabel, reaction.userReacted && styles.supportReactionLabelActive]}>
              {info.label}
            </Text>
            {reaction.count > 0 && (
              <Text style={[styles.supportReactionCount, reaction.userReacted && styles.supportReactionCountActive]}>
                {reaction.count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ReplyCard({
  reply,
  onReaction,
  onReport,
  helpfulnessRating,
  onRateHelpfulness,
  isOwnPost,
}: {
  reply: PostReply;
  onReaction: (replyId: string, type: string) => void;
  onReport: (replyId: string, authorId: string) => void;
  helpfulnessRating?: HelpfulnessRating;
  onRateHelpfulness?: (replyId: string, rating: HelpfulnessRating) => void;
  isOwnPost: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const labelInfo = reply.label ? REPLY_LABEL_INFO[reply.label] : null;
  const responseTypeInfo = reply.responseType ? getResponseTypeLabel(reply.responseType) : null;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.replyCard, { opacity: fadeAnim }, helpfulnessRating === 'helped' && styles.replyCardHighlighted]}>
      {responseTypeInfo && (
        <View style={[styles.responseTypeBadge, { backgroundColor: responseTypeInfo.color + '15' }]}>
          <Text style={styles.responseTypeEmoji}>{responseTypeInfo.emoji}</Text>
          <Text style={[styles.responseTypeText, { color: responseTypeInfo.color }]}>{responseTypeInfo.label}</Text>
        </View>
      )}
      {!responseTypeInfo && labelInfo && (
        <View style={[styles.replyLabelBadge, { backgroundColor: labelInfo.color + '15' }]}>
          <Text style={styles.replyLabelEmoji}>{labelInfo.emoji}</Text>
          <Text style={[styles.replyLabelText, { color: labelInfo.color }]}>{labelInfo.label}</Text>
        </View>
      )}
      <View style={styles.replyHeader}>
        <View style={styles.replyAuthorRow}>
          {reply.author.isTrustedHelper && (
            <View style={styles.trustedMini}>
              <Award size={10} color={Colors.primary} />
            </View>
          )}
          <Text style={styles.replyAuthor}>
            {reply.author.isAnonymous ? '🫧 Anonymous' : reply.author.displayName}
          </Text>
          {reply.author.isTrustedHelper && (
            <Text style={styles.trustedLabel}>Trusted helper</Text>
          )}
        </View>
        <View style={styles.replyHeaderRight}>
          <Text style={styles.replyTime}>{timeAgo(reply.createdAt)}</Text>
          {reply.author.id !== 'current_user' && (
            <TouchableOpacity
              style={styles.replyMoreBtn}
              onPress={() => onReport(reply.id, reply.author.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MoreHorizontal size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.replyBody}>{reply.body}</Text>
      <View style={styles.replyReactions}>
        {reply.supportReactions.map((reaction) => {
          const info = SUPPORT_REACTION_LABELS[reaction.type];
          if (!info) return null;
          return (
            <TouchableOpacity
              key={reaction.type}
              style={[styles.replyReactionBtn, reaction.userReacted && styles.replyReactionActive]}
              onPress={() => onReaction(reply.id, reaction.type)}
            >
              <Text style={styles.replyReactionEmoji}>{info.emoji}</Text>
              {reaction.count > 0 && (
                <Text style={styles.replyReactionCount}>{reaction.count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {isOwnPost && reply.author.id !== 'current_user' && onRateHelpfulness && (
        <View style={styles.helpfulnessRow}>
          {helpfulnessRating ? (
            <View style={styles.helpfulnessRated}>
              <Text style={styles.helpfulnessRatedText}>
                {HELPFULNESS_OPTIONS.find(o => o.id === helpfulnessRating)?.emoji}{' '}
                {HELPFULNESS_OPTIONS.find(o => o.id === helpfulnessRating)?.label}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.helpfulnessLabel}>Was this helpful?</Text>
              <View style={styles.helpfulnessOptions}>
                {HELPFULNESS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.helpfulnessBtn}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onRateHelpfulness(reply.id, option.id);
                    }}
                  >
                    <Text style={styles.helpfulnessBtnEmoji}>{option.emoji}</Text>
                    <Text style={styles.helpfulnessBtnText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const REPLY_LABELS: { id: ReplyLabel; emoji: string; label: string }[] = [
  { id: 'what-helped-me', emoji: '💡', label: 'What helped me' },
  { id: 'a-skill-that-worked', emoji: '🧘', label: 'A skill that worked' },
  { id: 'another-perspective', emoji: '🔄', label: 'Another perspective' },
  { id: 'personal-experience', emoji: '🫂', label: 'Personal experience' },
];

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    post,
    replies,
    isLoading,
    addReply,
    isAddingReply,
    toggleReaction,
    reportContent,
    blockUser,
    replyHelpfulness,
    rateReplyHelpfulness,
    threadClosure,
    saveThreadClosure,
  } = usePostDetail(id ?? '');

  const [replyText, setReplyText] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [showCW, setShowCW] = useState<boolean>(false);
  const [showActions, setShowActions] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportTargetId, setReportTargetId] = useState<string>('');
  const [reportTargetType, setReportTargetType] = useState<'post' | 'reply'>('post');
  const [reportTargetAuthorId, setReportTargetAuthorId] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);
  const [replyLabel, setReplyLabel] = useState<ReplyLabel | null>(null);
  const [showReplyLabels, setShowReplyLabels] = useState<boolean>(false);
  const [replySafetyWarning, setReplySafetyWarning] = useState<string | null>(null);
  const [responseType, setResponseType] = useState<ResponseType | null>(null);
  const [showResponseTypes, setShowResponseTypes] = useState<boolean>(false);
  const [showPausePrompt, setShowPausePrompt] = useState<boolean>(false);
  const [toneSuggestion, setToneSuggestion] = useState<string | null>(null);
  const [showClosureModal, setShowClosureModal] = useState<boolean>(false);
  const [closureType, setClosureType] = useState<ThreadClosure['type'] | null>(null);
  const [closureText, setClosureText] = useState<string>('');
  const scrollRef = useRef<ScrollView>(null);
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const isOwnPost = post?.author.id === 'current_user';

  const category = post ? CATEGORIES.find((c) => c.id === post.category) : null;
  const situationTag = post?.situationTag ? SITUATION_TAGS.find((t) => t.id === post.situationTag) : null;
  const suggestedTool = post ? getSuggestedTool(post) : null;

  const handleReplyTextChange = useCallback((text: string) => {
    setReplyText(text);
    if (text.length > 20) {
      const safety = checkContentSafety(text);
      if (!safety.isSafe && safety.suggestion) {
        setReplySafetyWarning(safety.suggestion);
      } else {
        setReplySafetyWarning(null);
      }
      const tone = checkTone(text);
      if (tone) {
        setToneSuggestion(tone.suggested);
      } else {
        setToneSuggestion(null);
      }
    } else {
      setReplySafetyWarning(null);
      setToneSuggestion(null);
    }
  }, []);

  const doSendReply = useCallback(() => {
    if (!replyText.trim() || !id) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addReply({
      postId: id,
      body: replyText.trim(),
      isAnonymous,
      label: replyLabel ?? undefined,
      responseType: responseType ?? undefined,
    });
    void trackEmotionalContextEvent('community_reply_type_selected', { responseType });
    setReplyText('');
    setReplyLabel(null);
    setResponseType(null);
    setShowReplyLabels(false);
    setShowResponseTypes(false);
    setReplySafetyWarning(null);
    setToneSuggestion(null);
    setShowPausePrompt(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 500);
  }, [replyText, id, isAnonymous, replyLabel, responseType, addReply]);

  const handleSendReply = useCallback(() => {
    if (!replyText.trim() || !id) return;

    const safety = checkContentSafety(replyText);
    if (!safety.isSafe) {
      Alert.alert(
        'A gentle reminder',
        safety.suggestion ?? 'Please review your reply.',
        [
          { text: 'Edit reply', style: 'cancel' },
          { text: 'Send anyway', onPress: doSendReply },
        ]
      );
      return;
    }

    if (!showPausePrompt) {
      setShowPausePrompt(true);
      return;
    }

    doSendReply();
  }, [replyText, id, showPausePrompt, doSendReply]);

  const handleRateHelpfulness = useCallback((replyId: string, rating: HelpfulnessRating) => {
    rateReplyHelpfulness({ replyId, rating });
  }, [rateReplyHelpfulness]);

  const handleSaveClosure = useCallback(() => {
    if (!closureType || !closureText.trim()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveThreadClosure({
      type: closureType,
      body: closureText.trim(),
      createdAt: Date.now(),
    });
    setShowClosureModal(false);
    setClosureType(null);
    setClosureText('');
  }, [closureType, closureText, saveThreadClosure]);

  const handleToggleReaction = useCallback(
    (type: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleReaction({ reactionType: type });
    },
    [toggleReaction]
  );

  const handleToggleReplyReaction = useCallback(
    (replyId: string, type: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleReaction({ reactionType: type, replyId });
    },
    [toggleReaction]
  );

  const handleShowActions = useCallback(() => {
    setShowActions(true);
    Animated.spring(actionsAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  }, [actionsAnim]);

  const handleHideActions = useCallback(() => {
    Animated.timing(actionsAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShowActions(false));
  }, [actionsAnim]);

  const handleOpenReportForPost = useCallback(() => {
    if (!post) return;
    handleHideActions();
    setReportTargetId(post.id);
    setReportTargetType('post');
    setReportTargetAuthorId(post.author.id);
    setSelectedReason(null);
    setReportSubmitted(false);
    setTimeout(() => setShowReportModal(true), 250);
  }, [post, handleHideActions]);

  const handleOpenReportForReply = useCallback((replyId: string, authorId: string) => {
    setReportTargetId(replyId);
    setReportTargetType('reply');
    setReportTargetAuthorId(authorId);
    setSelectedReason(null);
    setReportSubmitted(false);
    setShowReportModal(true);
  }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!selectedReason) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await reportContent({
        targetId: reportTargetId,
        targetType: reportTargetType,
        reason: selectedReason,
      });
      setReportSubmitted(true);
      console.log('[PostDetail] Report submitted for', reportTargetType, reportTargetId);
    } catch (error) {
      console.error('[PostDetail] Report failed:', error);
      Alert.alert('Something went wrong', 'Please try again.');
    }
  }, [selectedReason, reportTargetId, reportTargetType, reportContent]);

  const handleBlockUser = useCallback(async () => {
    handleHideActions();
    if (!post) return;
    Alert.alert(
      'Block this user?',
      'You will no longer see their posts or replies.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await blockUser(post.author.id);
              console.log('[PostDetail] Blocked user:', post.author.id);
              Alert.alert('User blocked', 'Their content will be hidden from your feed.');
              router.back();
            } catch (error) {
              console.error('[PostDetail] Block failed:', error);
            }
          },
        },
      ]
    );
  }, [post, blockUser, handleHideActions, router]);

  if (isLoading || !post) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.navBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Post</Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.navTitle} numberOfLines={1}>
            {category?.emoji} {category?.label}
          </Text>
          {post.author.id !== 'current_user' ? (
            <TouchableOpacity style={styles.backBtn} onPress={handleShowActions} testID="more-btn">
              <MoreHorizontal size={20} color={Colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              {post.isPinned && (
                <View style={styles.pinnedBadge}>
                  <Pin size={10} color={Colors.primary} />
                  <Text style={styles.pinnedText}>Pinned</Text>
                </View>
              )}
              {category && (
                <View style={[styles.categoryChip, { backgroundColor: category.color + '18' }]}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[styles.categoryLabel, { color: category.color }]}>{category.label}</Text>
                </View>
              )}
              {situationTag && (
                <View style={styles.situationChip}>
                  <Text style={styles.situationChipText}>{situationTag.emoji} {situationTag.label}</Text>
                </View>
              )}
            </View>

            <Text style={styles.postTitle}>{post.title}</Text>

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
                {post.author.isTrustedHelper && (
                  <Text style={styles.trustedLabel}>Trusted helper</Text>
                )}
              </View>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
            </View>

            {post.emotionalContext && (
              <View style={styles.emotionalContextBar}>
                {post.emotionalContext.primaryEmotion && (
                  <View style={styles.ecChip}>
                    <Text style={styles.ecChipText}>
                      {post.emotionalContext.primaryEmotion}
                    </Text>
                  </View>
                )}
                {post.emotionalContext.distressLevel != null && (
                  <View style={[
                    styles.ecChip,
                    { backgroundColor: getDistressLabel(post.emotionalContext.distressLevel).color + '18' },
                  ]}>
                    <Text style={[
                      styles.ecChipText,
                      { color: getDistressLabel(post.emotionalContext.distressLevel).color },
                    ]}>
                      {getDistressLabel(post.emotionalContext.distressLevel).label} ({post.emotionalContext.distressLevel}/10)
                    </Text>
                  </View>
                )}
                {post.emotionalContext.supportRequestType && (
                  <View style={[styles.ecChip, { backgroundColor: Colors.brandLilacSoft }]}>
                    <Text style={[styles.ecChipText, { color: Colors.brandLilac }]}>
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
                  {post.supportType === 'just-listening' ? '👂 Just needs to be heard' :
                   post.supportType === 'advice' ? '💡 Looking for advice' :
                   post.supportType === 'shared-experience' ? '🤝 Wants shared experiences' :
                   post.supportType === 'encouragement' ? '💪 Needs encouragement' :
                   '🧠 Help with a skill'}
                </Text>
              </View>
            )}

            {post.emotions && post.emotions.length > 0 && (
              <View style={styles.emotionsRow}>
                {post.emotions.map((emotion) => (
                  <View key={emotion} style={styles.emotionTag}>
                    <Text style={styles.emotionTagText}>{emotion}</Text>
                  </View>
                ))}
              </View>
            )}

            {post.hasContentWarning && !showCW && (
              <TouchableOpacity style={styles.cwOverlay} onPress={() => setShowCW(true)} activeOpacity={0.8}>
                <Shield size={20} color={Colors.accent} />
                <Text style={styles.cwTitle}>Content Warning</Text>
                {post.contentWarningText && <Text style={styles.cwDesc}>{post.contentWarningText}</Text>}
                <Text style={styles.cwAction}>Tap to reveal</Text>
              </TouchableOpacity>
            )}

            {(!post.hasContentWarning || showCW) && (
              <Text style={styles.postBody}>{post.body}</Text>
            )}

            <SupportReactionBar reactions={post.supportReactions} onToggle={handleToggleReaction} />

            {suggestedTool && (
              <View style={styles.toolCard}>
                <View style={styles.toolCardLeft}>
                  <Sparkles size={14} color={Colors.primary} />
                  <Text style={styles.toolCardText}>Related tool: {suggestedTool.toolName}</Text>
                </View>
                <TouchableOpacity style={styles.toolCardBtn}>
                  <Text style={styles.toolCardBtnText}>Try it</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.repliesSection}>
            <Text style={styles.repliesTitle}>
              {replies.length > 0 ? `${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}` : 'No replies yet'}
            </Text>

            {replies.length === 0 && (
              <View style={styles.emptyReplies}>
                <Text style={styles.emptyRepliesEmoji}>💬</Text>
                <Text style={styles.emptyRepliesText}>Be the first to share some support</Text>
              </View>
            )}

            {replies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                onReaction={handleToggleReplyReaction}
                onReport={handleOpenReportForReply}
                isOwnPost={isOwnPost ?? false}
                helpfulnessRating={replyHelpfulness[reply.id]}
                onRateHelpfulness={handleRateHelpfulness}
              />
            ))}
          </View>

          {threadClosure && (
            <View style={styles.closureCard}>
              <View style={styles.closureHeader}>
                <Text style={styles.closureEmoji}>{getClosureTypeLabel(threadClosure.type).emoji}</Text>
                <Text style={styles.closureTitle}>{getClosureTypeLabel(threadClosure.type).label}</Text>
              </View>
              <Text style={styles.closureBody}>{threadClosure.body}</Text>
            </View>
          )}

          {isOwnPost && !threadClosure && replies.length > 0 && (
            <TouchableOpacity
              style={styles.addClosureBtn}
              onPress={() => setShowClosureModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.addClosureEmoji}>💬</Text>
              <View>
                <Text style={styles.addClosureTitle}>Share a follow-up</Text>
                <Text style={styles.addClosureDesc}>Let others know what helped or what you realized</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {showPausePrompt && (
          <View style={styles.pausePromptBar}>
            <Text style={styles.pausePromptText}>Would you like to reread the post before responding?</Text>
            <View style={styles.pausePromptActions}>
              <TouchableOpacity
                style={styles.pausePromptBtn}
                onPress={() => {
                  setShowPausePrompt(false);
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <Text style={styles.pausePromptBtnText}>Reread</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pausePromptBtn, styles.pausePromptBtnSend]}
                onPress={() => {
                  setShowPausePrompt(false);
                  doSendReply();
                }}
              >
                <Text style={[styles.pausePromptBtnText, styles.pausePromptBtnSendText]}>Send now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {toneSuggestion && (
          <View style={styles.toneSuggestionBar}>
            <Sparkles size={12} color={Colors.brandLilac} />
            <Text style={styles.toneSuggestionText}>Consider: "{toneSuggestion}"</Text>
            <TouchableOpacity onPress={() => setToneSuggestion(null)}>
              <X size={12} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {replySafetyWarning && (
          <View style={styles.replySafetyBanner}>
            <Shield size={12} color={Colors.accent} />
            <Text style={styles.replySafetyText}>{replySafetyWarning}</Text>
            <TouchableOpacity onPress={() => setReplySafetyWarning(null)}>
              <X size={12} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {showResponseTypes && (
          <View style={styles.responseTypesBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.responseTypesRow}>
              {RESPONSE_TYPES.map((rt) => {
                const isSelected = responseType === rt.id;
                return (
                  <TouchableOpacity
                    key={rt.id}
                    style={[styles.responseTypePill, isSelected && { backgroundColor: rt.color + '20', borderColor: rt.color }]}
                    onPress={() => {
                      setResponseType(isSelected ? null : rt.id);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.responseTypePillEmoji}>{rt.emoji}</Text>
                    <Text style={[styles.responseTypePillText, isSelected && { color: rt.color, fontWeight: '600' as const }]}>
                      {rt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {showReplyLabels && !showResponseTypes && (
          <View style={styles.replyLabelsBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.replyLabelsRow}>
              {REPLY_LABELS.map((label) => {
                const isSelected = replyLabel === label.id;
                return (
                  <TouchableOpacity
                    key={label.id}
                    style={[styles.replyLabelPill, isSelected && styles.replyLabelPillActive]}
                    onPress={() => {
                      setReplyLabel(isSelected ? null : label.id);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.replyLabelPillEmoji}>{label.emoji}</Text>
                    <Text style={[styles.replyLabelPillText, isSelected && styles.replyLabelPillTextActive]}>
                      {label.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <SafeAreaView edges={['bottom']} style={styles.composerSafe}>
          <View style={styles.composer}>
            <TouchableOpacity
              style={[styles.anonToggle, isAnonymous && styles.anonToggleActive]}
              onPress={() => setIsAnonymous((prev) => !prev)}
              testID="anon-toggle"
            >
              {isAnonymous ? <EyeOff size={16} color={Colors.primary} /> : <Eye size={16} color={Colors.textMuted} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.labelToggle, showResponseTypes && styles.labelToggleActive]}
              onPress={() => {
                setShowResponseTypes((prev) => !prev);
                if (showReplyLabels) setShowReplyLabels(false);
              }}
            >
              <Tag size={16} color={showResponseTypes ? Colors.primary : Colors.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={styles.composerInput}
              placeholder={isAnonymous ? 'Reply anonymously...' : 'Write a supportive reply...'}
              placeholderTextColor={Colors.textMuted}
              value={replyText}
              onChangeText={handleReplyTextChange}
              multiline
              maxLength={1000}
              testID="reply-input"
            />
            <TouchableOpacity
              style={[styles.sendBtn, replyText.trim().length > 0 && styles.sendBtnActive]}
              onPress={handleSendReply}
              disabled={replyText.trim().length === 0 || isAddingReply}
              testID="send-reply-btn"
            >
              {isAddingReply ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Send size={16} color={replyText.trim().length > 0 ? Colors.white : Colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {showActions && (
        <Modal transparent animationType="none" visible={showActions}>
          <TouchableOpacity style={styles.actionOverlay} activeOpacity={1} onPress={handleHideActions}>
            <Animated.View
              style={[
                styles.actionSheet,
                {
                  transform: [{ translateY: actionsAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }],
                  opacity: actionsAnim,
                },
              ]}
            >
              <SafeAreaView edges={['bottom']}>
                <View style={styles.actionSheetHandle} />
                <Text style={styles.actionSheetTitle}>Options</Text>
                <TouchableOpacity style={styles.actionItem} onPress={handleOpenReportForPost} testID="report-post-btn">
                  <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Flag size={18} color="#E65100" />
                  </View>
                  <View style={styles.actionTextGroup}>
                    <Text style={styles.actionLabel}>Report this post</Text>
                    <Text style={styles.actionDesc}>Let us know if something feels unsafe</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem} onPress={handleBlockUser} testID="block-user-btn">
                  <View style={[styles.actionIcon, { backgroundColor: Colors.dangerLight }]}>
                    <Ban size={18} color={Colors.danger} />
                  </View>
                  <View style={styles.actionTextGroup}>
                    <Text style={[styles.actionLabel, { color: Colors.danger }]}>Block this user</Text>
                    <Text style={styles.actionDesc}>Hide all their content from your feed</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCancelBtn} onPress={handleHideActions}>
                  <Text style={styles.actionCancelText}>Cancel</Text>
                </TouchableOpacity>
              </SafeAreaView>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}

      <Modal transparent animationType="slide" visible={showReportModal} onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.reportOverlay}>
          <View style={styles.reportSheet}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>{reportSubmitted ? 'Thank you' : 'Report content'}</Text>
                <TouchableOpacity style={styles.reportCloseBtn} onPress={() => setShowReportModal(false)} testID="close-report-btn">
                  <X size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {reportSubmitted ? (
                <View style={styles.reportSuccess}>
                  <View style={styles.reportSuccessIcon}>
                    <Check size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.reportSuccessTitle}>Report received</Text>
                  <Text style={styles.reportSuccessText}>
                    We take community safety seriously. Our team will review this content.
                  </Text>
                  <TouchableOpacity style={styles.reportDoneBtn} onPress={() => setShowReportModal(false)}>
                    <Text style={styles.reportDoneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.reportSubtext}>Help us understand what feels wrong. Your report is confidential.</Text>
                  {REPORT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[styles.reportReasonItem, selectedReason === reason.id && styles.reportReasonActive]}
                      onPress={() => {
                        setSelectedReason(reason.id);
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.reportReasonEmoji}>{reason.emoji}</Text>
                      <Text style={[styles.reportReasonText, selectedReason === reason.id && styles.reportReasonTextActive]}>
                        {reason.label}
                      </Text>
                      {selectedReason === reason.id && (
                        <View style={styles.reportReasonCheck}>
                          <Check size={14} color={Colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                  {reportTargetAuthorId !== 'current_user' && (
                    <TouchableOpacity
                      style={styles.reportBlockRow}
                      onPress={() => {
                        setShowReportModal(false);
                        setTimeout(() => void handleBlockUser(), 300);
                      }}
                    >
                      <Ban size={14} color={Colors.textMuted} />
                      <Text style={styles.reportBlockText}>You can also block this user</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.reportSubmitBtn, selectedReason && styles.reportSubmitBtnActive]}
                    onPress={handleSubmitReport}
                    disabled={!selectedReason}
                  >
                    <Text style={[styles.reportSubmitText, selectedReason && styles.reportSubmitTextActive]}>Submit Report</Text>
                  </TouchableOpacity>
                </>
              )}
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="slide" visible={showClosureModal} onRequestClose={() => setShowClosureModal(false)}>
        <View style={styles.reportOverlay}>
          <View style={styles.reportSheet}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>Share a follow-up</Text>
                <TouchableOpacity style={styles.reportCloseBtn} onPress={() => setShowClosureModal(false)}>
                  <X size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.closureModalDesc}>Help future readers by sharing what you learned from this thread.</Text>
              <View style={styles.closureTypesRow}>
                {CLOSURE_TYPES.map((ct) => {
                  const isSelected = closureType === ct.id;
                  return (
                    <TouchableOpacity
                      key={ct.id}
                      style={[styles.closureTypePill, isSelected && styles.closureTypePillActive]}
                      onPress={() => {
                        setClosureType(isSelected ? null : ct.id);
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.closureTypePillEmoji}>{ct.emoji}</Text>
                      <Text style={[styles.closureTypePillText, isSelected && styles.closureTypePillTextActive]}>{ct.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={styles.closureInput}
                placeholder="Share your thoughts..."
                placeholderTextColor={Colors.textMuted}
                value={closureText}
                onChangeText={setClosureText}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.reportSubmitBtn, (closureType && closureText.trim()) ? styles.reportSubmitBtnActive : undefined]}
                onPress={handleSaveClosure}
                disabled={!closureType || !closureText.trim()}
              >
                <Text style={[styles.reportSubmitText, (closureType && closureText.trim()) ? styles.reportSubmitTextActive : undefined]}>Share follow-up</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  safeTop: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, flex: 1, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textMuted },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingHorizontal: 16 },
  postContainer: { backgroundColor: Colors.white, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: Colors.borderLight },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pinnedText: { fontSize: 11, fontWeight: '600' as const, color: Colors.primary },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 5 },
  categoryEmoji: { fontSize: 12 },
  categoryLabel: { fontSize: 12, fontWeight: '600' as const },
  situationChip: { backgroundColor: Colors.warmGlow, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  situationChipText: { fontSize: 10, color: Colors.accent, fontWeight: '500' as const },
  postTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, lineHeight: 26, marginBottom: 8 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustedBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  trustedLabel: { fontSize: 10, color: Colors.primary, fontWeight: '600' as const, marginLeft: 2 },
  postAuthor: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' as const },
  metaDot: { fontSize: 13, color: Colors.textMuted },
  postTime: { fontSize: 13, color: Colors.textMuted },
  supportTypeBadge: { backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 12 },
  supportTypeText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  emotionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  emotionTag: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  emotionTagText: { fontSize: 11, color: Colors.primaryDark, fontWeight: '500' as const },
  cwOverlay: { backgroundColor: Colors.accentLight, borderRadius: 14, padding: 24, alignItems: 'center', gap: 8 },
  cwTitle: { fontSize: 15, fontWeight: '600' as const, color: Colors.accent },
  cwDesc: { fontSize: 13, color: Colors.textSecondary },
  cwAction: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  postBody: { fontSize: 15, color: Colors.text, lineHeight: 24, marginBottom: 16 },
  supportReactionBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 14 },
  supportReactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  supportReactionBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary + '40' },
  supportReactionEmoji: { fontSize: 14 },
  supportReactionLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' as const },
  supportReactionLabelActive: { color: Colors.primaryDark },
  supportReactionCount: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' as const, marginLeft: 2 },
  supportReactionCountActive: { color: Colors.primaryDark },
  toolCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 12 },
  toolCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  toolCardText: { fontSize: 13, color: Colors.primaryDark, fontWeight: '500' as const },
  toolCardBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  toolCardBtnText: { fontSize: 12, color: Colors.white, fontWeight: '600' as const },
  repliesSection: { marginTop: 20 },
  repliesTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, marginBottom: 14 },
  emptyReplies: { alignItems: 'center', paddingVertical: 32 },
  emptyRepliesEmoji: { fontSize: 28, marginBottom: 8 },
  emptyRepliesText: { fontSize: 14, color: Colors.textMuted },
  replyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.borderLight },
  replyLabelBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  replyLabelEmoji: { fontSize: 11 },
  replyLabelText: { fontSize: 11, fontWeight: '600' as const },
  replyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  replyAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustedMini: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  replyHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyAuthor: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  replyTime: { fontSize: 11, color: Colors.textMuted },
  replyMoreBtn: { padding: 2 },
  replyBody: { fontSize: 14, color: Colors.text, lineHeight: 21, marginBottom: 10 },
  replyReactions: { flexDirection: 'row', gap: 6 },
  replyReactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  replyReactionActive: { backgroundColor: Colors.primaryLight },
  replyReactionEmoji: { fontSize: 12 },
  replyReactionCount: { fontSize: 11, color: Colors.textMuted },
  bottomSpacer: { height: 20 },
  replySafetyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.accentLight, paddingHorizontal: 16, paddingVertical: 10 },
  replySafetyText: { flex: 1, fontSize: 12, color: Colors.accent, lineHeight: 16 },
  replyLabelsBar: { backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingVertical: 8 },
  replyLabelsRow: { paddingHorizontal: 12, gap: 6 },
  replyLabelPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  replyLabelPillActive: { backgroundColor: Colors.primaryLight },
  replyLabelPillEmoji: { fontSize: 12 },
  replyLabelPillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  replyLabelPillTextActive: { color: Colors.primaryDark, fontWeight: '600' as const },
  composerSafe: { backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  anonToggle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  anonToggleActive: { backgroundColor: Colors.primaryLight },
  labelToggle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  labelToggleActive: { backgroundColor: Colors.primaryLight },
  composerInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
    ...Platform.select({ web: { outlineStyle: 'none' } as Record<string, string> }),
  },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  sendBtnActive: { backgroundColor: Colors.primary },
  actionOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  actionSheetHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  actionSheetTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text, marginBottom: 16 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionTextGroup: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '600' as const, color: Colors.text, marginBottom: 2 },
  actionDesc: { fontSize: 12, color: Colors.textMuted },
  actionCancelBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
  actionCancelText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textMuted },
  reportOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  reportSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, maxHeight: '80%' },
  reportHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  reportTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  reportCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  reportSubtext: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 18 },
  reportReasonItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  reportReasonActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  reportReasonEmoji: { fontSize: 16 },
  reportReasonText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' as const },
  reportReasonTextActive: { color: Colors.primaryDark, fontWeight: '600' as const },
  reportReasonCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  reportBlockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 4 },
  reportBlockText: { fontSize: 13, color: Colors.textMuted },
  reportSubmitBtn: { backgroundColor: Colors.surface, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  reportSubmitBtnActive: { backgroundColor: Colors.primary },
  reportSubmitText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textMuted },
  reportSubmitTextActive: { color: Colors.white },
  reportSuccess: { alignItems: 'center', paddingVertical: 24 },
  reportSuccessIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  reportSuccessTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 8 },
  reportSuccessText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21, textAlign: 'center', paddingHorizontal: 12, marginBottom: 20 },
  reportDoneBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14 },
  reportDoneBtnText: { fontSize: 15, fontWeight: '600' as const, color: Colors.white },
  replyCardHighlighted: { borderColor: Colors.primary + '30', backgroundColor: Colors.primaryLight + '40' },
  responseTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  responseTypeEmoji: { fontSize: 11 },
  responseTypeText: { fontSize: 11, fontWeight: '600' as const },
  helpfulnessRow: { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 10, marginTop: 10 },
  helpfulnessRated: { flexDirection: 'row', alignItems: 'center' },
  helpfulnessRatedText: { fontSize: 12, color: Colors.primary, fontWeight: '500' as const },
  helpfulnessLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
  helpfulnessOptions: { flexDirection: 'row', gap: 8 },
  helpfulnessBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  helpfulnessBtnEmoji: { fontSize: 12 },
  helpfulnessBtnText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' as const },
  emotionalContextBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  ecChip: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  ecChipText: { fontSize: 11, color: Colors.primaryDark, fontWeight: '500' as const },
  pausePromptBar: { backgroundColor: Colors.warmGlow, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  pausePromptText: { fontSize: 13, color: Colors.accent, fontWeight: '500' as const, marginBottom: 8, lineHeight: 18 },
  pausePromptActions: { flexDirection: 'row', gap: 10 },
  pausePromptBtn: { backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderLight },
  pausePromptBtnSend: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pausePromptBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  pausePromptBtnSendText: { color: Colors.white },
  toneSuggestionBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.brandLilacSoft, paddingHorizontal: 16, paddingVertical: 10 },
  toneSuggestionText: { flex: 1, fontSize: 12, color: Colors.brandLilac, lineHeight: 16, fontStyle: 'italic' as const },
  responseTypesBar: { backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingVertical: 8 },
  responseTypesRow: { paddingHorizontal: 12, gap: 6 },
  responseTypePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'transparent' },
  responseTypePillEmoji: { fontSize: 12 },
  responseTypePillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  closureCard: { backgroundColor: Colors.warmGlow, borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: Colors.accent + '20' },
  closureHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  closureEmoji: { fontSize: 16 },
  closureTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.accent },
  closureBody: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  addClosureBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: Colors.borderLight },
  addClosureEmoji: { fontSize: 20 },
  addClosureTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 2 },
  addClosureDesc: { fontSize: 12, color: Colors.textMuted },
  closureModalDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  closureTypesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  closureTypePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: 'transparent' },
  closureTypePillActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary + '40' },
  closureTypePillEmoji: { fontSize: 14 },
  closureTypePillText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  closureTypePillTextActive: { color: Colors.primaryDark, fontWeight: '600' as const },
  closureInput: { backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: Colors.text, minHeight: 100, marginBottom: 12, lineHeight: 20, ...Platform.select({ web: { outlineStyle: 'none' } as Record<string, string> }) },
});
