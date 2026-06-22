export type PostCategory =
  | 'relationships'
  | 'daily-struggles'
  | 'success-stories'
  | 'coping-skills'
  | 'questions'
  | 'therapy-dbt'
  | 'venting'
  | 'daily-check-in'
  | 'progress-wins'
  | 'ask-community';

export type SituationTag =
  | 'relationship-conflict'
  | 'feeling-rejected'
  | 'shame-regret'
  | 'overwhelmed'
  | 'daily-check-in'
  | 'celebrating-progress'
  | 'asking-advice';

export type ReplyLabel =
  | 'what-helped-me'
  | 'a-skill-that-worked'
  | 'another-perspective'
  | 'personal-experience';

export type SupportReactionType = 'understand' | 'experienced' | 'sending-support' | 'helped-me';

export type SupportRequestType = 'validation' | 'shared-experience' | 'advice' | 'another-perspective';

export type ResponseType = 'validation' | 'shared-experience' | 'advice' | 'another-perspective';

export type HelpfulnessRating = 'helped' | 'gave-perspective' | 'not-helpful';

export interface EmotionalContext {
  primaryEmotion?: string;
  distressLevel?: number;
  supportRequestType?: SupportRequestType;
}

export interface ThreadClosure {
  type: 'what-i-realized' | 'what-helped' | 'what-i-will-try';
  body: string;
  createdAt: number;
}

export interface ReplyHelpfulness {
  replyId: string;
  rating: HelpfulnessRating;
  ratedAt: number;
}

export interface ToneSuggestion {
  original: string;
  suggested: string;
  reason: string;
}

export interface PostAuthor {
  id: string;
  displayName: string;
  isAnonymous: boolean;
  username?: string;
  avatarColor?: string;
  isTrustedHelper?: boolean;
  helpfulReplyCount?: number;
}

export interface SupportiveReaction {
  type: 'heart' | 'hug' | 'strength' | 'seen' | 'relate';
  count: number;
  userReacted: boolean;
}

export interface SupportReaction {
  type: SupportReactionType;
  count: number;
  userReacted: boolean;
}

export interface CommunityPost {
  id: string;
  title: string;
  body: string;
  category: PostCategory;
  situationTag?: SituationTag;
  author: PostAuthor;
  createdAt: number;
  isPinned: boolean;
  hasContentWarning: boolean;
  contentWarningText?: string;
  replyCount: number;
  reactions: SupportiveReaction[];
  supportReactions: SupportReaction[];
  emotions?: string[];
  supportType?: string;
  suggestedToolId?: string;
  suggestedToolName?: string;
  emotionalContext?: EmotionalContext;
  threadClosure?: ThreadClosure;
  replyHelpfulness?: ReplyHelpfulness[];
}

export interface PostReply {
  id: string;
  postId: string;
  body: string;
  author: PostAuthor;
  createdAt: number;
  reactions: SupportiveReaction[];
  supportReactions: SupportReaction[];
  label?: ReplyLabel;
  isHelpful?: boolean;
  responseType?: ResponseType;
  helpfulnessRating?: HelpfulnessRating;
}

export interface NewPostInput {
  title: string;
  body: string;
  category: PostCategory;
  isAnonymous: boolean;
  hasContentWarning: boolean;
  contentWarningText?: string;
  situationTag?: SituationTag;
  emotions?: string[];
  supportType?: string;
  emotionalContext?: EmotionalContext;
}

export interface NewReplyInput {
  postId: string;
  body: string;
  isAnonymous: boolean;
  label?: ReplyLabel;
  responseType?: ResponseType;
}

export type ReportReason =
  | 'harmful'
  | 'spam'
  | 'harassment'
  | 'misinformation'
  | 'other';

export interface ReportInput {
  targetId: string;
  targetType: 'post' | 'reply';
  reason: ReportReason;
  details?: string;
}

export interface CategoryInfo {
  id: PostCategory;
  label: string;
  emoji: string;
  color: string;
}

export interface BlockedUser {
  userId: string;
  blockedAt: number;
}

export interface CommunityPrivateMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: number;
  reported?: boolean;
}

export interface CommunityPrivateConversation {
  id: string;
  participant: PostAuthor;
  messages: CommunityPrivateMessage[];
  createdAt: number;
  updatedAt: number;
  blocked?: boolean;
  reported?: boolean;
}

export interface SupportCircle {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  memberCount: number;
  isJoined: boolean;
  recentActivity: number;
  tags: string[];
}

export interface CirclePost {
  id: string;
  circleId: string;
  title: string;
  body: string;
  author: PostAuthor;
  createdAt: number;
  replyCount: number;
  reactions: SupportiveReaction[];
  supportReactions: SupportReaction[];
}

export interface CommunityGuideline {
  title: string;
  description: string;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  reason?: string;
  suggestion?: string;
}

export interface PostSuggestion {
  type: 'context' | 'support-type' | 'clarity';
  message: string;
}

export interface CommunityMatchPreferences {
  interests: PostCategory[];
  emotionalPatterns: string[];
  preferredCircles: string[];
}

export type SupportTopic =
  | 'relationship-triggers'
  | 'fear-of-rejection'
  | 'shame-recovery'
  | 'emotional-regulation'
  | 'communication-skills'
  | 'daily-stability';

export interface SupportPreferences {
  topics: SupportTopic[];
  updatedAt: number;
}

export interface CirclePost {
  id: string;
  circleId: string;
  title: string;
  body: string;
  author: PostAuthor;
  createdAt: number;
  replyCount: number;
  reactions: SupportiveReaction[];
  supportReactions: SupportReaction[];
  type: CirclePostType;
}

export type CirclePostType = 'update' | 'question' | 'progress' | 'encouragement';

export interface CircleReply {
  id: string;
  circlePostId: string;
  body: string;
  author: PostAuthor;
  createdAt: number;
  reactions: SupportiveReaction[];
  supportReactions: SupportReaction[];
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  durationDays: number;
  dailyPrompt: string;
  participantCount: number;
  isJoined: boolean;
  startDate: number;
  tags: string[];
}

export interface ChallengeProgress {
  challengeId: string;
  userId: string;
  displayName: string;
  completedDays: number;
  totalDays: number;
  lastCheckedIn: number;
  isCurrentUser: boolean;
}

export interface TrustedContributor {
  userId: string;
  displayName: string;
  helpfulCount: number;
  positiveFeedback: number;
  activityStreak: number;
  badge: 'trusted-helper';
}
