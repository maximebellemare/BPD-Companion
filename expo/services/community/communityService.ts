import { communityRepository } from '@/services/repositories';
import {
  CommunityPost,
  PostReply,
  NewPostInput,
  NewReplyInput,
  PostCategory,
} from '@/types/community';

export async function fetchPosts(category?: PostCategory | null, search?: string): Promise<CommunityPost[]> {
  return communityRepository.getPosts(category, search);
}

export async function fetchPost(postId: string): Promise<CommunityPost | null> {
  return communityRepository.getPost(postId);
}

export async function fetchReplies(postId: string): Promise<PostReply[]> {
  return communityRepository.getReplies(postId);
}

export async function createPost(input: NewPostInput): Promise<CommunityPost> {
  return communityRepository.createPost(input);
}

export async function createReply(input: NewReplyInput): Promise<PostReply> {
  return communityRepository.createReply(input);
}

export async function toggleReaction(
  postId: string,
  reactionType: string,
  replyId?: string
): Promise<void> {
  return communityRepository.toggleReaction(postId, reactionType, replyId);
}
