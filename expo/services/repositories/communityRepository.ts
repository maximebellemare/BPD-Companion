import { MOCK_POSTS, MOCK_REPLIES } from '@/constants/community';
import {
  CommunityPost,
  PostReply,
  NewPostInput,
  NewReplyInput,
  PostCategory,
} from '@/types/community';
import { ICommunityRepository } from './types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class LocalCommunityRepository implements ICommunityRepository {
  private posts: CommunityPost[] = [...MOCK_POSTS];
  private replies: Record<string, PostReply[]> = JSON.parse(JSON.stringify(MOCK_REPLIES));

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
    const newPost: CommunityPost = {
      id: `p_${Date.now()}`,
      title: input.title,
      body: input.body,
      category: input.category,
      author: {
        id: 'current_user',
        displayName: input.isAnonymous ? 'Anonymous' : 'You',
        isAnonymous: input.isAnonymous,
      },
      createdAt: Date.now(),
      isPinned: false,
      hasContentWarning: input.hasContentWarning,
      contentWarningText: input.contentWarningText,
      replyCount: 0,
      reactions: [
        { type: 'heart', count: 0, userReacted: false },
        { type: 'hug', count: 0, userReacted: false },
        { type: 'relate', count: 0, userReacted: false },
      ],
    };
    this.posts = [newPost, ...this.posts];
    console.log('[CommunityRepository] Created post:', newPost.id);
    return newPost;
  }

  async createReply(input: NewReplyInput): Promise<PostReply> {
    await delay(350);
    const newReply: PostReply = {
      id: `r_${Date.now()}`,
      postId: input.postId,
      body: input.body,
      author: {
        id: 'current_user',
        displayName: input.isAnonymous ? 'Anonymous' : 'You',
        isAnonymous: input.isAnonymous,
      },
      createdAt: Date.now(),
      reactions: [{ type: 'heart', count: 0, userReacted: false }],
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
      }
    }
    console.log('[CommunityRepository] Toggled reaction:', reactionType, 'on post:', postId);
  }
}
