import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  blockPrivateConversationUser,
  getPrivateConversation,
  getPrivateConversations,
  reportPrivateConversation,
  sendPrivateMessage,
  startPrivateConversation,
} from '@/services/community/communityMessagingService';
import { PostAuthor } from '@/types/community';

export function useCommunityMessages() {
  const queryClient = useQueryClient();
  const conversationsQuery = useQuery({
    queryKey: ['community', 'private-messages'],
    queryFn: () => getPrivateConversations(),
  });

  const startMutation = useMutation({
    mutationFn: ({ participant, openingMessage }: { participant: PostAuthor; openingMessage?: string }) =>
      startPrivateConversation(participant, openingMessage),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'private-messages'] });
    },
  });

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    startConversation: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    refetch: conversationsQuery.refetch,
  };
}

export function useCommunityPrivateConversation(conversationId: string) {
  const queryClient = useQueryClient();
  const conversationQuery = useQuery({
    queryKey: ['community', 'private-message', conversationId],
    queryFn: () => getPrivateConversation(conversationId),
    enabled: !!conversationId,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendPrivateMessage(conversationId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'private-message', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'private-messages'] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: (reason: string) => reportPrivateConversation(conversationId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'private-message', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'private-messages'] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => blockPrivateConversationUser(conversationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'private-message', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'private-messages'] });
      void queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });

  return {
    conversation: conversationQuery.data ?? null,
    isLoading: conversationQuery.isLoading,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    reportConversation: reportMutation.mutateAsync,
    isReporting: reportMutation.isPending,
    blockUser: blockMutation.mutateAsync,
    isBlocking: blockMutation.isPending,
  };
}
