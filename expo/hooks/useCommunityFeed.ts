import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import {
  fetchPosts,
  fetchPost,
  fetchReplies,
  createPost,
  createReply,
  toggleReaction,
  reportContent,
  blockUser,
  fetchCircles,
  joinCircle,
  leaveCircle,
} from '@/services/community/communityService';
import { PostCategory, NewPostInput, NewReplyInput, ReportInput, HelpfulnessRating, ThreadClosure } from '@/types/community';
import {
  saveReplyHelpfulness,
  getReplyHelpfulness,
  saveThreadClosure,
  getThreadClosure,
  trackEmotionalContextEvent,
} from '@/services/community/communityEmotionalContextService';

export function useCommunityFeed() {
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const postsQuery = useQuery({
    queryKey: ['community', 'posts', selectedCategory, searchQuery],
    queryFn: () => fetchPosts(selectedCategory, searchQuery),
  });

  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setSearchQuery('');
  }, []);

  return {
    posts: postsQuery.data ?? [],
    isLoading: postsQuery.isLoading,
    isRefetching: postsQuery.isRefetching,
    refetch: postsQuery.refetch,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    clearFilters,
  };
}

export function usePostDetail(postId: string) {
  const queryClient = useQueryClient();

  const postQuery = useQuery({
    queryKey: ['community', 'post', postId],
    queryFn: () => fetchPost(postId),
    enabled: !!postId,
  });

  const repliesQuery = useQuery({
    queryKey: ['community', 'replies', postId],
    queryFn: () => fetchReplies(postId),
    enabled: !!postId,
  });

  const replyMutation = useMutation({
    mutationFn: (input: NewReplyInput) => createReply(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'replies', postId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'post', postId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: ({ reactionType, replyId }: { reactionType: string; replyId?: string }) =>
      toggleReaction(postId, reactionType, replyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'post', postId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'replies', postId] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: (input: ReportInput) => reportContent(input),
  });

  const blockMutation = useMutation({
    mutationFn: (userId: string) => blockUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });

  const helpfulnessQuery = useQuery({
    queryKey: ['community', 'helpfulness', postId],
    queryFn: () => getReplyHelpfulness(postId),
    enabled: !!postId,
  });

  const closureQuery = useQuery({
    queryKey: ['community', 'closure', postId],
    queryFn: () => getThreadClosure(postId),
    enabled: !!postId,
  });

  const helpfulnessMutation = useMutation({
    mutationFn: ({ replyId, rating }: { replyId: string; rating: HelpfulnessRating }) =>
      saveReplyHelpfulness(postId, replyId, rating),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'helpfulness', postId] });
      void trackEmotionalContextEvent('community_reply_helpful_marked');
    },
  });

  const closureMutation = useMutation({
    mutationFn: (closure: ThreadClosure) => saveThreadClosure(postId, closure),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'closure', postId] });
      void trackEmotionalContextEvent('community_thread_closed');
    },
  });

  return {
    post: postQuery.data ?? null,
    replies: repliesQuery.data ?? [],
    isLoading: postQuery.isLoading || repliesQuery.isLoading,
    addReply: replyMutation.mutate,
    isAddingReply: replyMutation.isPending,
    toggleReaction: reactionMutation.mutate,
    reportContent: reportMutation.mutateAsync,
    isReporting: reportMutation.isPending,
    blockUser: blockMutation.mutateAsync,
    isBlocking: blockMutation.isPending,
    replyHelpfulness: helpfulnessQuery.data ?? {},
    rateReplyHelpfulness: helpfulnessMutation.mutate,
    threadClosure: closureQuery.data ?? null,
    saveThreadClosure: closureMutation.mutate,
  };
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: NewPostInput) => createPost(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });

  return {
    createPost: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

export function useSupportCircles() {
  const queryClient = useQueryClient();

  const circlesQuery = useQuery({
    queryKey: ['community', 'circles'],
    queryFn: () => fetchCircles(),
  });

  const joinMutation = useMutation({
    mutationFn: (circleId: string) => joinCircle(circleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'circles'] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (circleId: string) => leaveCircle(circleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'circles'] });
    },
  });

  return {
    circles: circlesQuery.data ?? [],
    isLoading: circlesQuery.isLoading,
    joinCircle: joinMutation.mutate,
    leaveCircle: leaveMutation.mutate,
    isJoining: joinMutation.isPending,
    isLeaving: leaveMutation.isPending,
  };
}
