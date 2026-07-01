import { assertSupabaseConfigured, formatSupabaseError, supabase } from '@/lib/supabase/client';
import { getCommunityAuthor, loadCommunityProfile } from '@/services/community/communityProfileService';
import {
  BlockedUser,
  CommunityPost,
  NewPostInput,
  NewReplyInput,
  PostAuthor,
  PostCategory,
  PostReply,
  ReportInput,
  SupportCircle,
  SupportReaction,
  SupportiveReaction,
} from '@/types/community';
import { ICommunityRepository } from './types';

type CommunityPostRow = Record<string, any>;
type CommunityReplyRow = Record<string, any>;
type CommunityCircleRow = Record<string, any>;
type ReactionRow = {
  target_id?: string;
  post_id?: string;
  reply_id?: string;
  reaction_type: string;
  user_id: string;
};

const SUPPORTIVE_REACTION_TYPES: SupportiveReaction['type'][] = ['heart', 'hug', 'strength', 'seen', 'relate'];
const SUPPORT_REACTION_TYPES: SupportReaction['type'][] = ['understand', 'experienced', 'sending-support', 'helped-me'];

function throwCommunityError(error: unknown, fallback: string): never {
  throw new Error(formatSupabaseError(error, fallback));
}

async function getCurrentUserId(): Promise<string> {
  assertSupabaseConfigured();
  const { data, error } = await supabase.auth.getUser();
  if (error) throwCommunityError(error, 'Could not load your Community account.');
  if (!data.user?.id) throw new Error('Sign in before using Community.');
  return data.user.id;
}

async function getRequiredAuthor(isAnonymous: boolean): Promise<PostAuthor> {
  const profile = await loadCommunityProfile();
  if (!profile) {
    throw new Error('Set up your community profile before posting.');
  }
  return getCommunityAuthor(profile, isAnonymous);
}

function authorFields(author: PostAuthor, userId: string) {
  return {
    author_user_id: userId,
    author_display_name: author.displayName,
    author_username: author.username ?? null,
    author_avatar_color: author.avatarColor ?? null,
    is_anonymous: author.isAnonymous,
  };
}

function mapAuthor(row: Record<string, any>, currentUserId: string): PostAuthor {
  const isOwn = row.author_user_id === currentUserId;
  const isAnonymous = Boolean(row.is_anonymous);
  return {
    id: isOwn ? 'current_user' : row.author_user_id,
    displayName: isAnonymous ? 'Anonymous' : (row.author_display_name || row.author_username || 'Community member'),
    username: row.author_username ?? undefined,
    avatarColor: row.author_avatar_color ?? undefined,
    isAnonymous,
  };
}

function countReactions<T extends string>(
  types: T[],
  rows: ReactionRow[],
  targetId: string,
  currentUserId: string,
): Array<{ type: T; count: number; userReacted: boolean }> {
  return types.map((type) => {
    const matches = rows.filter((row) => {
      const rowTarget = row.target_id ?? row.reply_id ?? row.post_id;
      return rowTarget === targetId && row.reaction_type === type;
    });
    return {
      type,
      count: matches.length,
      userReacted: matches.some((row) => row.user_id === currentUserId),
    };
  });
}

function mapPost(row: CommunityPostRow, currentUserId: string, replyCount: number, reactionRows: ReactionRow[]): CommunityPost {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    situationTag: row.situation_tag ?? undefined,
    author: mapAuthor(row, currentUserId),
    createdAt: new Date(row.created_at).getTime(),
    isPinned: Boolean(row.is_pinned),
    hasContentWarning: Boolean(row.has_content_warning),
    contentWarningText: row.content_warning_text ?? undefined,
    replyCount,
    emotions: Array.isArray(row.emotions) ? row.emotions : undefined,
    supportType: row.support_type ?? undefined,
    suggestedToolId: row.suggested_tool_id ?? undefined,
    suggestedToolName: row.suggested_tool_name ?? undefined,
    emotionalContext: row.emotional_context ?? undefined,
    reactions: countReactions(SUPPORTIVE_REACTION_TYPES, reactionRows, row.id, currentUserId),
    supportReactions: countReactions(SUPPORT_REACTION_TYPES, reactionRows, row.id, currentUserId),
  };
}

function mapReply(row: CommunityReplyRow, currentUserId: string, reactionRows: ReactionRow[]): PostReply {
  return {
    id: row.id,
    postId: row.post_id,
    body: row.body,
    author: mapAuthor(row, currentUserId),
    createdAt: new Date(row.created_at).getTime(),
    reactions: countReactions(SUPPORTIVE_REACTION_TYPES, reactionRows, row.id, currentUserId),
    supportReactions: countReactions(SUPPORT_REACTION_TYPES, reactionRows, row.id, currentUserId),
    label: row.label ?? undefined,
    responseType: row.response_type ?? undefined,
  };
}

function mapCircle(
  row: CommunityCircleRow,
  currentUserId: string,
  memberships: Array<{ circle_id: string; user_id: string }>,
): SupportCircle {
  const circleMemberships = memberships.filter((membership) => membership.circle_id === row.id);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
    color: row.color,
    tags: Array.isArray(row.tags) ? row.tags : [],
    recentActivity: row.recent_activity ? new Date(row.recent_activity).getTime() : new Date(row.created_at).getTime(),
    memberCount: circleMemberships.length,
    isJoined: circleMemberships.some((membership) => membership.user_id === currentUserId),
  };
}

export class SupabaseCommunityRepository implements ICommunityRepository {
  async getPosts(category?: PostCategory | null, search?: string): Promise<CommunityPost[]> {
    const currentUserId = await getCurrentUserId();
    let query = supabase
      .from('community_posts')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},body.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throwCommunityError(error, 'Could not load Community posts.');

    return this.decoratePosts(data ?? [], currentUserId);
  }

  async getPost(postId: string): Promise<CommunityPost | null> {
    const currentUserId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (error) throwCommunityError(error, 'Could not load this Community post.');
    if (!data) return null;

    const [post] = await this.decoratePosts([data], currentUserId);
    return post ?? null;
  }

  async getReplies(postId: string): Promise<PostReply[]> {
    const currentUserId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('community_replies')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throwCommunityError(error, 'Could not load replies.');
    const replyIds = (data ?? []).map((reply) => reply.id);
    const reactionRows = await this.getReactionRows('community_reply_reactions', 'reply_id', replyIds);
    return (data ?? []).map((reply) => mapReply(reply, currentUserId, reactionRows));
  }

  async createPost(input: NewPostInput): Promise<CommunityPost> {
    const currentUserId = await getCurrentUserId();
    const author = await getRequiredAuthor(input.isAnonymous);
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        title: input.title.trim(),
        body: input.body.trim(),
        category: input.category,
        situation_tag: input.situationTag ?? null,
        has_content_warning: input.hasContentWarning,
        content_warning_text: input.contentWarningText?.trim() || null,
        emotions: input.emotions ?? null,
        support_type: input.supportType ?? null,
        emotional_context: input.emotionalContext ?? null,
        ...authorFields(author, currentUserId),
      })
      .select('*')
      .single();

    if (error) throwCommunityError(error, 'Could not create your Community post.');
    return mapPost(data, currentUserId, 0, []);
  }

  async createReply(input: NewReplyInput): Promise<PostReply> {
    const currentUserId = await getCurrentUserId();
    const author = await getRequiredAuthor(input.isAnonymous);
    const { data, error } = await supabase
      .from('community_replies')
      .insert({
        post_id: input.postId,
        body: input.body.trim(),
        label: input.label ?? null,
        response_type: input.responseType ?? null,
        ...authorFields(author, currentUserId),
      })
      .select('*')
      .single();

    if (error) throwCommunityError(error, 'Could not add your reply.');
    return mapReply(data, currentUserId, []);
  }

  async deletePost(postId: string): Promise<void> {
    const currentUserId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('community_posts')
      .select('author_user_id')
      .eq('id', postId)
      .maybeSingle();

    if (error) throwCommunityError(error, 'Could not delete this post.');
    if (!data || data.author_user_id !== currentUserId) throw new Error('You can only delete your own posts.');

    await supabase.from('community_reply_reactions').delete().eq('post_id', postId);
    await supabase.from('community_post_reactions').delete().eq('post_id', postId);
    await supabase.from('community_replies').delete().eq('post_id', postId);
    const { error: deleteError } = await supabase.from('community_posts').delete().eq('id', postId);
    if (deleteError) throwCommunityError(deleteError, 'Could not delete this post.');
  }

  async deleteReply(postId: string, replyId: string): Promise<void> {
    const currentUserId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('community_replies')
      .select('author_user_id')
      .eq('id', replyId)
      .eq('post_id', postId)
      .maybeSingle();

    if (error) throwCommunityError(error, 'Could not delete this reply.');
    if (!data || data.author_user_id !== currentUserId) throw new Error('You can only delete your own replies.');

    await supabase.from('community_reply_reactions').delete().eq('reply_id', replyId);
    const { error: deleteError } = await supabase.from('community_replies').delete().eq('id', replyId);
    if (deleteError) throwCommunityError(deleteError, 'Could not delete this reply.');
  }

  async toggleReaction(postId: string, reactionType: string, replyId?: string): Promise<void> {
    const currentUserId = await getCurrentUserId();
    const table = replyId ? 'community_reply_reactions' : 'community_post_reactions';
    const idColumn = replyId ? 'reply_id' : 'post_id';
    const targetId = replyId ?? postId;

    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq(idColumn, targetId)
      .eq('user_id', currentUserId)
      .eq('reaction_type', reactionType)
      .maybeSingle();

    if (error) throwCommunityError(error, 'Could not update reaction.');
    if (data?.id) {
      const { error: deleteError } = await supabase.from(table).delete().eq('id', data.id);
      if (deleteError) throwCommunityError(deleteError, 'Could not update reaction.');
      return;
    }

    const payload: Record<string, string> = {
      user_id: currentUserId,
      post_id: postId,
      reaction_type: reactionType,
    };
    payload[idColumn] = targetId;
    const { error: insertError } = await supabase.from(table).insert(payload);
    if (insertError) throwCommunityError(insertError, 'Could not update reaction.');
  }

  async reportContent(input: ReportInput): Promise<void> {
    const currentUserId = await getCurrentUserId();
    const { error } = await supabase.from('community_reports').insert({
      reporter_user_id: currentUserId,
      target_id: input.targetId,
      target_type: input.targetType,
      reason: input.reason,
      details: input.details?.trim() || null,
    });
    if (error) throwCommunityError(error, 'Could not send report.');
  }

  async blockUser(userId: string): Promise<void> {
    const currentUserId = await getCurrentUserId();
    if (userId === 'current_user' || userId === currentUserId) throw new Error('You cannot block yourself.');
    const { error } = await supabase
      .from('community_blocked_users')
      .upsert(
        { blocker_user_id: currentUserId, blocked_user_id: userId },
        { onConflict: 'blocker_user_id,blocked_user_id' },
      );
    if (error) throwCommunityError(error, 'Could not block this user.');
  }

  async unblockUser(userId: string): Promise<void> {
    const currentUserId = await getCurrentUserId();
    const { error } = await supabase
      .from('community_blocked_users')
      .delete()
      .eq('blocker_user_id', currentUserId)
      .eq('blocked_user_id', userId);
    if (error) throwCommunityError(error, 'Could not unblock this user.');
  }

  async getBlockedUsers(): Promise<BlockedUser[]> {
    const currentUserId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('community_blocked_users')
      .select('blocked_user_id, created_at')
      .eq('blocker_user_id', currentUserId);
    if (error) throwCommunityError(error, 'Could not load blocked users.');
    return (data ?? []).map((row) => ({
      userId: row.blocked_user_id,
      blockedAt: new Date(row.created_at).getTime(),
    }));
  }

  async getCircles(): Promise<SupportCircle[]> {
    const currentUserId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('community_circles')
      .select('*')
      .order('name', { ascending: true });
    if (error) throwCommunityError(error, 'Could not load support circles.');

    const circleIds = (data ?? []).map((circle) => circle.id);
    const memberships = circleIds.length ? await this.getCircleMemberships(circleIds) : [];
    return (data ?? []).map((circle) => mapCircle(circle, currentUserId, memberships));
  }

  async joinCircle(circleId: string): Promise<void> {
    const currentUserId = await getCurrentUserId();
    const { error } = await supabase
      .from('community_circle_members')
      .upsert(
        { circle_id: circleId, user_id: currentUserId },
        { onConflict: 'circle_id,user_id' },
      );
    if (error) throwCommunityError(error, 'Could not join this circle.');
  }

  async leaveCircle(circleId: string): Promise<void> {
    const currentUserId = await getCurrentUserId();
    const { error } = await supabase
      .from('community_circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id', currentUserId);
    if (error) throwCommunityError(error, 'Could not leave this circle.');
  }

  private async decoratePosts(rows: CommunityPostRow[], currentUserId: string): Promise<CommunityPost[]> {
    const blocked = await this.getBlockedUsers();
    const blockedIds = new Set(blocked.map((item) => item.userId));
    const visibleRows = rows.filter((row) => row.author_user_id === currentUserId || !blockedIds.has(row.author_user_id));
    const postIds = visibleRows.map((post) => post.id);
    const [replyRows, reactionRows] = await Promise.all([
      postIds.length ? this.getReplyCountRows(postIds) : Promise.resolve([]),
      this.getReactionRows('community_post_reactions', 'post_id', postIds),
    ]);
    const replyCounts = replyRows.reduce<Record<string, number>>((acc, reply) => {
      acc[reply.post_id] = (acc[reply.post_id] ?? 0) + 1;
      return acc;
    }, {});
    return visibleRows.map((post) => mapPost(post, currentUserId, replyCounts[post.id] ?? 0, reactionRows));
  }

  private async getReplyCountRows(postIds: string[]): Promise<Array<{ post_id: string }>> {
    const { data, error } = await supabase
      .from('community_replies')
      .select('post_id')
      .in('post_id', postIds);
    if (error) throwCommunityError(error, 'Could not load reply counts.');
    return data ?? [];
  }

  private async getReactionRows(table: string, idColumn: string, ids: string[]): Promise<ReactionRow[]> {
    if (!ids.length) return [];
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .in(idColumn, ids);
    if (error) throwCommunityError(error, 'Could not load reactions.');
    return data ?? [];
  }

  private async getCircleMemberships(circleIds: string[]): Promise<Array<{ circle_id: string; user_id: string }>> {
    const { data, error } = await supabase
      .from('community_circle_members')
      .select('circle_id, user_id')
      .in('circle_id', circleIds);
    if (error) throwCommunityError(error, 'Could not load circle memberships.');
    return data ?? [];
  }
}
