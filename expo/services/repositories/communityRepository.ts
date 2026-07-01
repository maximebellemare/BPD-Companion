import { DEV_SEEDED_POSTS, DEV_SEEDED_REPLIES, DEV_SEEDED_CIRCLES } from '@/constants/community';
import {
  CommunityPost,
  PostReply,
  NewPostInput,
  NewReplyInput,
  PostCategory,
  ReportInput,
  BlockedUser,
  SupportCircle,
  SupportReaction,
} from '@/types/community';
import { ICommunityRepository } from './types';
import { ensureCommunityProfile, getCommunityAuthor } from '@/services/community/communityProfileService';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEFAULT_SUPPORT_REACTIONS: SupportReaction[] = [
  { type: 'understand', count: 0, userReacted: false },
  { type: 'experienced', count: 0, userReacted: false },
  { type: 'sending-support', count: 0, userReacted: false },
  { type: 'helped-me', count: 0, userReacted: false },
];

export class LocalCommunityRepository implements ICommunityRepository {
  private posts: CommunityPost[] = JSON.parse(JSON.stringify(DEV_SEEDED_POSTS));
  private replies: Record<string, PostReply[]> = JSON.parse(JSON.stringify(DEV_SEEDED_REPLIES));
  private blockedUsers: BlockedUser[] = [];
  private reports: ReportInput[] = [];
  private circles: SupportCircle[] = JSON.parse(JSON.stringify(DEV_SEEDED_CIRCLES));

  async getPosts(category?: PostCategory | null, search?: string): Promise<CommunityPost[]> {
    await delay(300);
    let filtered = [...this.posts];

    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (search && search.trim().length > 0) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });

    console.log('[CommunityRepository] Fetched', filtered.length, 'posts');
    return filtered;
  }

  async getPost(postId: string): Promise<CommunityPost | null> {
    await delay(200);
    return this.posts.find((p) => p.id === postId) ?? null;
  }

  async getReplies(postId: string): Promise<PostReply[]> {
    await delay(250);
    return this.replies[postId] ?? [];
  }

  async createPost(input: NewPostInput): Promise<CommunityPost> {
    await delay(400);
    const profile = await ensureCommunityProfile();
    const newPost: CommunityPost = {
      id: `p_${Date.now()}`,
      title: input.title,
      body: input.body,
      category: input.category,
      situationTag: input.situationTag,
      author: getCommunityAuthor(profile, input.isAnonymous),
      createdAt: Date.now(),
      isPinned: false,
      hasContentWarning: input.hasContentWarning,
      contentWarningText: input.contentWarningText,
      replyCount: 0,
      emotions: input.emotions,
      supportType: input.supportType,
      emotionalContext: input.emotionalContext,
      reactions: [
        { type: 'heart', count: 0, userReacted: false },
        { type: 'hug', count: 0, userReacted: false },
        { type: 'relate', count: 0, userReacted: false },
      ],
      supportReactions: [...DEFAULT_SUPPORT_REACTIONS],
    };
    this.posts = [newPost, ...this.posts];
    console.log('[CommunityRepository] Created post:', newPost.id);
    return newPost;
  }

  async createReply(input: NewReplyInput): Promise<PostReply> {
    await delay(350);
    const profile = await ensureCommunityProfile();
    const newReply: PostReply = {
      id: `r_${Date.now()}`,
      postId: input.postId,
      body: input.body,
      author: getCommunityAuthor(profile, input.isAnonymous),
      createdAt: Date.now(),
      reactions: [{ type: 'heart', count: 0, userReacted: false }],
      supportReactions: [...DEFAULT_SUPPORT_REACTIONS],
      label: input.label,
      responseType: input.responseType,
    };

    if (!this.replies[input.postId]) {
      this.replies[input.postId] = [];
    }
    this.replies[input.postId].push(newReply);

    const post = this.posts.find((p) => p.id === input.postId);
    if (post) {
      post.replyCount += 1;
    }

    console.log('[CommunityRepository] Created reply:', newReply.id, 'for post:', input.postId);
    return newReply;
  }

  async deletePost(postId: string): Promise<void> {
    await delay(220);
    const post = this.posts.find((p) => p.id === postId);
    if (!post || post.author.id !== 'current_user') {
      throw new Error('You can only delete your own posts.');
    }
    this.posts = this.posts.filter((p) => p.id !== postId);
    delete this.replies[postId];
    this.reports = this.reports.filter((report) => report.targetId !== postId);
    console.log('[CommunityRepository] Deleted post:', postId);
  }

  async deleteReply(postId: string, replyId: string): Promise<void> {
    await delay(180);
    const postReplies = this.replies[postId] ?? [];
    const reply = postReplies.find((r) => r.id === replyId);
    if (!reply || reply.author.id !== 'current_user') {
      throw new Error('You can only delete your own replies.');
    }
    this.replies[postId] = postReplies.filter((r) => r.id !== replyId);
    const post = this.posts.find((p) => p.id === postId);
    if (post) {
      post.replyCount = Math.max(0, post.replyCount - 1);
    }
    console.log('[CommunityRepository] Deleted reply:', replyId, 'for post:', postId);
  }

  async toggleReaction(
    postId: string,
    reactionType: string,
    replyId?: string,
  ): Promise<void> {
    await delay(150);
    if (replyId) {
      const postReplies = this.replies[postId];
      if (postReplies) {
        const reply = postReplies.find((r) => r.id === replyId);
        if (reply) {
          const reaction = reply.reactions.find((r) => r.type === reactionType);
          if (reaction) {
            reaction.userReacted = !reaction.userReacted;
            reaction.count += reaction.userReacted ? 1 : -1;
          }
          const supportReaction = reply.supportReactions.find((r) => r.type === reactionType);
          if (supportReaction) {
            supportReaction.userReacted = !supportReaction.userReacted;
            supportReaction.count += supportReaction.userReacted ? 1 : -1;
          }
        }
      }
    } else {
      const post = this.posts.find((p) => p.id === postId);
      if (post) {
        const reaction = post.reactions.find((r) => r.type === reactionType);
        if (reaction) {
          reaction.userReacted = !reaction.userReacted;
          reaction.count += reaction.userReacted ? 1 : -1;
        }
        const supportReaction = post.supportReactions.find((r) => r.type === reactionType);
        if (supportReaction) {
          supportReaction.userReacted = !supportReaction.userReacted;
          supportReaction.count += supportReaction.userReacted ? 1 : -1;
        }
      }
    }
    console.log('[CommunityRepository] Toggled reaction:', reactionType, 'on post:', postId);
  }

  async reportContent(input: ReportInput): Promise<void> {
    await delay(300);
    this.reports.push(input);
    console.log('[CommunityRepository] Reported:', input.targetType, input.targetId, 'reason:', input.reason);
  }

  async blockUser(userId: string): Promise<void> {
    await delay(200);
    if (!this.blockedUsers.find((b) => b.userId === userId)) {
      this.blockedUsers.push({ userId, blockedAt: Date.now() });
    }
    console.log('[CommunityRepository] Blocked user:', userId);
  }

  async unblockUser(userId: string): Promise<void> {
    await delay(200);
    this.blockedUsers = this.blockedUsers.filter((b) => b.userId !== userId);
    console.log('[CommunityRepository] Unblocked user:', userId);
  }

  async getBlockedUsers(): Promise<BlockedUser[]> {
    await delay(100);
    return [...this.blockedUsers];
  }

  async getCircles(): Promise<SupportCircle[]> {
    await delay(250);
    return [...this.circles];
  }

  async joinCircle(circleId: string): Promise<void> {
    await delay(200);
    const circle = this.circles.find((c) => c.id === circleId);
    if (circle) {
      circle.isJoined = true;
      circle.memberCount += 1;
    }
    console.log('[CommunityRepository] Joined circle:', circleId);
  }

  async leaveCircle(circleId: string): Promise<void> {
    await delay(200);
    const circle = this.circles.find((c) => c.id === circleId);
    if (circle) {
      circle.isJoined = false;
      circle.memberCount = Math.max(0, circle.memberCount - 1);
    }
    console.log('[CommunityRepository] Left circle:', circleId);
  }
}
