import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  fetchChallenges,
  joinChallenge,
  leaveChallenge,
  checkInChallenge,
  fetchChallengeProgress,
  fetchCirclePosts,
  fetchCirclePost,
  fetchCircleReplies,
  createCirclePost,
  createCircleReply,
  deleteCircleReply,
  toggleCircleReaction,
} from '@/services/community/communityService';
import {
  loadSupportPreferences,
  saveSupportPreferences,
  getRecommendedCircles,
  getMatchingChallenges,
  trackSupportCircleEvent,
} from '@/services/community/supportMatchingService';
import { SupportTopic, SupportPreferences, CirclePostType } from '@/types/community';
import { useSupportCircles as useBaseCircles } from '@/hooks/useCommunityFeed';

export function useSupportPreferences() {
  const queryClient = useQueryClient();

  const prefsQuery = useQuery({
    queryKey: ['support', 'preferences'],
    queryFn: () => loadSupportPreferences(),
  });

  const saveMutation = useMutation({
    mutationFn: (topics: SupportTopic[]) => {
      const prefs: SupportPreferences = { topics, updatedAt: Date.now() };
      return saveSupportPreferences(prefs);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['support', 'preferences'] });
      trackSupportCircleEvent('support_preferences_updated');
    },
  });

  return {
    preferences: prefsQuery.data ?? { topics: [], updatedAt: 0 },
    isLoading: prefsQuery.isLoading,
    savePreferences: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}

export function useRecommendedCircles() {
  const { circles } = useBaseCircles();
  const { preferences } = useSupportPreferences();

  const recommended = useMemo(
    () => getRecommendedCircles(circles, preferences, 3),
    [circles, preferences]
  );

  return { recommended };
}

export function useChallenges() {
  const queryClient = useQueryClient();
  const { preferences } = useSupportPreferences();

  const challengesQuery = useQuery({
    queryKey: ['community', 'challenges'],
    queryFn: () => fetchChallenges(),
  });

  const joinMutation = useMutation({
    mutationFn: (challengeId: string) => joinChallenge(challengeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'challenges'] });
      trackSupportCircleEvent('challenge_joined');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (challengeId: string) => leaveChallenge(challengeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'challenges'] });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (challengeId: string) => checkInChallenge(challengeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'challenges'] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'challenge-progress'] });
      trackSupportCircleEvent('challenge_completed');
    },
  });

  const matchedChallenges = useMemo(() => {
    const all = challengesQuery.data ?? [];
    return getMatchingChallenges(all, preferences);
  }, [challengesQuery.data, preferences]);

  return {
    challenges: matchedChallenges,
    isLoading: challengesQuery.isLoading,
    joinChallenge: joinMutation.mutate,
    leaveChallenge: leaveMutation.mutate,
    checkInChallenge: checkInMutation.mutate,
    isJoining: joinMutation.isPending,
    isLeaving: leaveMutation.isPending,
    isCheckingIn: checkInMutation.isPending,
  };
}

export function useChallengeProgress(challengeId: string) {
  const progressQuery = useQuery({
    queryKey: ['community', 'challenge-progress', challengeId],
    queryFn: () => fetchChallengeProgress(challengeId),
    enabled: !!challengeId,
  });

  return {
    progress: progressQuery.data ?? [],
    isLoading: progressQuery.isLoading,
  };
}

export function useCirclePosts(circleId: string) {
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ['community', 'circle-posts', circleId],
    queryFn: () => fetchCirclePosts(circleId),
    enabled: !!circleId,
  });

  const createMutation = useMutation({
    mutationFn: ({ title, body, type }: { title: string; body: string; type: CirclePostType }) =>
      createCirclePost(circleId, title, body, type),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'circle-posts', circleId] });
      trackSupportCircleEvent('support_circle_post_created');
    },
  });

  return {
    posts: postsQuery.data ?? [],
    isLoading: postsQuery.isLoading,
    createPost: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

export function useCircleThread(circleId: string, postId: string) {
  const queryClient = useQueryClient();

  const postQuery = useQuery({
    queryKey: ['community', 'circle-post', circleId, postId],
    queryFn: () => fetchCirclePost(circleId, postId),
    enabled: !!circleId && !!postId,
  });

  const repliesQuery = useQuery({
    queryKey: ['community', 'circle-replies', postId],
    queryFn: () => fetchCircleReplies(postId),
    enabled: !!postId,
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => createCircleReply(postId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'circle-replies', postId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'circle-post', circleId, postId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'circle-posts', circleId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (replyId: string) => deleteCircleReply(postId, replyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'circle-replies', postId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'circle-post', circleId, postId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'circle-posts', circleId] });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: ({ reactionType, replyId }: { reactionType: string; replyId?: string }) =>
      toggleCircleReaction(postId, reactionType, replyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'circle-replies', postId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'circle-post', circleId, postId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'circle-posts', circleId] });
    },
  });

  return {
    post: postQuery.data ?? null,
    replies: repliesQuery.data ?? [],
    isLoading: postQuery.isLoading || repliesQuery.isLoading,
    isError: postQuery.isError || repliesQuery.isError,
    addReply: replyMutation.mutate,
    isAddingReply: replyMutation.isPending,
    deleteReply: deleteMutation.mutateAsync,
    toggleReaction: reactionMutation.mutate,
  };
}
