import { storageService } from '@/services/storage/storageService';
import { blockUser, getBlockedUsers } from '@/services/community/communityService';
import { ensureCommunityProfile } from '@/services/community/communityProfileService';
import { CommunityPrivateConversation, CommunityPrivateMessage, PostAuthor } from '@/types/community';

const CONVERSATIONS_KEY = 'community_private_conversations';
const REPORTS_KEY = 'community_private_reports';

type PrivateReport = {
  targetUserId: string;
  conversationId: string;
  reason: string;
  createdAt: number;
};

function normalizeParticipant(author: PostAuthor): PostAuthor {
  return {
    id: author.id,
    displayName: author.displayName,
    username: author.username,
    avatarColor: author.avatarColor,
    isAnonymous: author.isAnonymous,
    isTrustedHelper: author.isTrustedHelper,
    helpfulReplyCount: author.helpfulReplyCount,
  };
}

async function loadConversations(): Promise<CommunityPrivateConversation[]> {
  const stored = await storageService.get<CommunityPrivateConversation[]>(CONVERSATIONS_KEY);
  return Array.isArray(stored) ? stored : [];
}

async function saveConversations(conversations: CommunityPrivateConversation[]): Promise<void> {
  await storageService.set(CONVERSATIONS_KEY, conversations);
}

async function assertCanMessage(userId: string): Promise<void> {
  if (userId === 'current_user') {
    throw new Error('You cannot message yourself.');
  }
  const blocked = await getBlockedUsers();
  if (blocked.some(item => item.userId === userId)) {
    throw new Error('You blocked this user. Unblock them before messaging.');
  }
}

export async function getPrivateConversations(): Promise<CommunityPrivateConversation[]> {
  const blocked = await getBlockedUsers();
  const blockedIds = new Set(blocked.map(item => item.userId));
  return (await loadConversations())
    .map(conversation => ({ ...conversation, blocked: blockedIds.has(conversation.participant.id) }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getPrivateConversation(conversationId: string): Promise<CommunityPrivateConversation | null> {
  const conversations = await getPrivateConversations();
  return conversations.find(conversation => conversation.id === conversationId) ?? null;
}

export async function startPrivateConversation(participant: PostAuthor, openingMessage?: string): Promise<CommunityPrivateConversation> {
  await assertCanMessage(participant.id);
  const profile = await ensureCommunityProfile();

  const now = Date.now();
  const conversationId = `dm_${participant.id}`;
  const conversations = await loadConversations();
  const existing = conversations.find(conversation => conversation.id === conversationId);
  if (existing) {
    if (openingMessage?.trim()) {
      return sendPrivateMessage(conversationId, openingMessage);
    }
    return existing;
  }

  const messages: CommunityPrivateMessage[] = openingMessage?.trim()
    ? [{
      id: `dmm_${now}`,
      conversationId,
      senderId: 'current_user',
      senderName: profile.displayName || profile.username || 'You',
      body: openingMessage.trim(),
      createdAt: now,
    }]
    : [];

  const conversation: CommunityPrivateConversation = {
    id: conversationId,
    participant: normalizeParticipant(participant),
    messages,
    createdAt: now,
    updatedAt: now,
  };
  await saveConversations([conversation, ...conversations]);
  return conversation;
}

export async function sendPrivateMessage(conversationId: string, body: string): Promise<CommunityPrivateConversation> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Write a message first.');
  const profile = await ensureCommunityProfile();

  const conversations = await loadConversations();
  const existing = conversations.find(conversation => conversation.id === conversationId);
  if (!existing) throw new Error('Conversation not found.');
  await assertCanMessage(existing.participant.id);

  const now = Date.now();
  const message: CommunityPrivateMessage = {
    id: `dmm_${now}`,
    conversationId,
    senderId: 'current_user',
    senderName: profile.displayName || profile.username || 'You',
    body: trimmed,
    createdAt: now,
  };
  const updated = {
    ...existing,
    messages: [...existing.messages, message],
    updatedAt: now,
  };
  await saveConversations(conversations.map(conversation => conversation.id === conversationId ? updated : conversation));
  return updated;
}

export async function reportPrivateConversation(conversationId: string, reason: string): Promise<void> {
  const conversation = await getPrivateConversation(conversationId);
  if (!conversation) throw new Error('Conversation not found.');
  const reports = await storageService.get<PrivateReport[]>(REPORTS_KEY);
  const next = [
    ...(Array.isArray(reports) ? reports : []),
    { targetUserId: conversation.participant.id, conversationId, reason, createdAt: Date.now() },
  ];
  await storageService.set(REPORTS_KEY, next);
  const conversations = await loadConversations();
  await saveConversations(conversations.map(item => item.id === conversationId ? { ...item, reported: true } : item));
}

export async function blockPrivateConversationUser(conversationId: string): Promise<void> {
  const conversation = await getPrivateConversation(conversationId);
  if (!conversation) throw new Error('Conversation not found.');
  await blockUser(conversation.participant.id);
}
