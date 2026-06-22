import { assertSupabaseConfigured, formatSupabaseError, supabase } from '@/lib/supabase/client';
import { getCommunityAuthor, loadCommunityProfile } from '@/services/community/communityProfileService';
import {
  CirclePost,
  CirclePostType,
  CircleReply,
  PostAuthor,
  SupportReaction,
  SupportiveReaction,
} from '@/types/community';

type CirclePostRow = Record<string, any>;
type CircleReplyRow = Record<string, any>;
type ReactionRow = {
  post_id: string;
  reply_id?: string;
  user_id: string;
  reaction_type: string;
};

const SUPPORTIVE_REACTION_TYPES: SupportiveReaction['type'][] = ['heart', 'hug', 'strength', 'seen', 'relate'];
const SUPPORT_REACTION_TYPES: SupportReaction['type'][] = ['understand', 'experienced', 'sending-support', 'helped-me'];

function throwCircleError(error: unknown, fallback: string): never {
  throw new Error(formatSupabaseError(error, fallback));
}

async function getCurrentUserId(): Promise<string> {
  assertSupabaseConfigured();
  const { data, error } = await supabase.auth.getUser();
  if (error) throwCircleError(error, 'Could not load your Community account.');
  if (!data.user?.id) throw new Error('Sign in before using Community.');
  return data.user.id;
}

async function getRequiredAuthor(): Promise<PostAuthor> {
  const profile = await loadCommunityProfile();
  if (!profile) throw new Error('Set up your community profile before posting.');
  return getCommunityAuthor(profile, false);
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
    const matches = rows.filter((row) => (row.reply_id ?? row.post_id) === targetId && row.reaction_type === type);
    return {
      type,
      count: matches.length,
      userReacted: matches.some((row) => row.user_id === currentUserId),
    };
  });
}

function mapCirclePost(
  row: CirclePostRow,
  currentUserId: string,
  replyCount: number,
  reactionRows: ReactionRow[],
): CirclePost {
  return {
    id: row.id,
    circleId: row.circle_id,
    title: row.title,
    body: row.body,
    type: row.type,
    author: mapAuthor(row, currentUserId),
    createdAt: new Date(row.created_at).getTime(),
    replyCount,
    reactions: countReactions(SUPPORTIVE_REACTION_TYPES, reactionRows, row.id, currentUserId),
    supportReactions: countReactions(SUPPORT_REACTION_TYPES, reactionRows, row.id, currentUserId),
  };
}

function mapCircleReply(row: CircleReplyRow, currentUserId: string, reactionRows: ReactionRow[]): CircleReply {
  return {
    id: row.id,
    circlePostId: row.circle_post_id,
    body: row.body,
    author: mapAuthor(row, currentUserId),
    createdAt: new Date(row.created_at).getTime(),
    reactions: countReactions(SUPPORTIVE_REACTION_TYPES, reactionRows, row.id, currentUserId),
    supportReactions: countReactions(SUPPORT_REACTION_TYPES, reactionRows, row.id, currentUserId),
  };
}

async function getReactionRows(table: string, idColumn: string, ids: string[]): Promise<ReactionRow[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase.from(table).select('*').in(idColumn, ids);
  if (error) throwCircleError(error, 'Could not load reactions.');
  return data ?? [];
}

async function getReplyCountRows(postIds: string[]): Promise<Array<{ circle_post_id: string }>> {
  if (!postIds.length) return [];
  const { data, error } = await supabase
    .from('community_circle_replies')
    .select('circle_post_id')
    .in('circle_post_id', postIds);
  if (error) throwCircleError(error, 'Could not load reply counts.');
  return data ?? [];
}

export async function fetchSupabaseCirclePosts(circleId: string): Promise<CirclePost[]> {
  const currentUserId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('community_circle_posts')
    .select('*')
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false });
  if (error) throwCircleError(error, 'Could not load circle discussions.');

  const rows = data ?? [];
  const postIds = rows.map((post) => post.id);
  const [replyRows, reactionRows] = await Promise.all([
    getReplyCountRows(postIds),
    getReactionRows('community_circle_post_reactions', 'post_id', postIds),
  ]);
  const replyCounts = replyRows.reduce<Record<string, number>>((acc, reply) => {
    acc[reply.circle_post_id] = (acc[reply.circle_post_id] ?? 0) + 1;
    return acc;
  }, {});

  return rows.map((post) => mapCirclePost(post, currentUserId, replyCounts[post.id] ?? 0, reactionRows));
}

export async function createSupabaseCirclePost(
  circleId: string,
  title: string,
  body: string,
  type: CirclePostType,
): Promise<CirclePost> {
  const currentUserId = await getCurrentUserId();
  const author = await getRequiredAuthor();
  const { data, error } = await supabase
    .from('community_circle_posts')
    .insert({
      circle_id: circleId,
      title: title.trim(),
      body: body.trim(),
      type,
      ...authorFields(author, currentUserId),
    })
    .select('*')
    .single();
  if (error) throwCircleError(error, 'Could not create circle discussion.');
  return mapCirclePost(data, currentUserId, 0, []);
}

export async function fetchSupabaseCirclePost(circleId: string, postId: string): Promise<CirclePost | null> {
  const currentUserId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('community_circle_posts')
    .select('*')
    .eq('circle_id', circleId)
    .eq('id', postId)
    .maybeSingle();
  if (error) throwCircleError(error, 'Could not load circle discussion.');
  if (!data) return null;

  const [replyRows, reactionRows] = await Promise.all([
    getReplyCountRows([postId]),
    getReactionRows('community_circle_post_reactions', 'post_id', [postId]),
  ]);
  return mapCirclePost(data, currentUserId, replyRows.length, reactionRows);
}

export async function fetchSupabaseCircleReplies(postId: string): Promise<CircleReply[]> {
  const currentUserId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('community_circle_replies')
    .select('*')
    .eq('circle_post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throwCircleError(error, 'Could not load circle replies.');

  const replyIds = (data ?? []).map((reply) => reply.id);
  const reactionRows = await getReactionRows('community_circle_reply_reactions', 'reply_id', replyIds);
  return (data ?? []).map((reply) => mapCircleReply(reply, currentUserId, reactionRows));
}

export async function createSupabaseCircleReply(postId: string, body: string): Promise<CircleReply> {
  const currentUserId = await getCurrentUserId();
  const author = await getRequiredAuthor();
  const { data, error } = await supabase
    .from('community_circle_replies')
    .insert({
      circle_post_id: postId,
      body: body.trim(),
      ...authorFields(author, currentUserId),
    })
    .select('*')
    .single();
  if (error) throwCircleError(error, 'Could not add circle reply.');
  return mapCircleReply(data, currentUserId, []);
}

export async function deleteSupabaseCircleReply(postId: string, replyId: string): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('community_circle_replies')
    .select('author_user_id')
    .eq('id', replyId)
    .eq('circle_post_id', postId)
    .maybeSingle();
  if (error) throwCircleError(error, 'Could not delete circle reply.');
  if (!data || data.author_user_id !== currentUserId) throw new Error('You can only delete your own replies.');

  await supabase.from('community_circle_reply_reactions').delete().eq('reply_id', replyId);
  const { error: deleteError } = await supabase.from('community_circle_replies').delete().eq('id', replyId);
  if (deleteError) throwCircleError(deleteError, 'Could not delete circle reply.');
}

export async function toggleSupabaseCircleReaction(
  postId: string,
  reactionType: string,
  replyId?: string,
): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const table = replyId ? 'community_circle_reply_reactions' : 'community_circle_post_reactions';
  const idColumn = replyId ? 'reply_id' : 'post_id';
  const targetId = replyId ?? postId;

  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq(idColumn, targetId)
    .eq('user_id', currentUserId)
    .eq('reaction_type', reactionType)
    .maybeSingle();
  if (error) throwCircleError(error, 'Could not update reaction.');

  if (data?.id) {
    const { error: deleteError } = await supabase.from(table).delete().eq('id', data.id);
    if (deleteError) throwCircleError(deleteError, 'Could not update reaction.');
    return;
  }

  const payload: Record<string, string> = {
    user_id: currentUserId,
    post_id: postId,
    reaction_type: reactionType,
  };
  payload[idColumn] = targetId;
  const { error: insertError } = await supabase.from(table).insert(payload);
  if (insertError) throwCircleError(insertError, 'Could not update reaction.');
}
