import { JournalEntry, MessageDraft } from '@/types';
import { AIConversation } from '@/types/ai';
import { UserProfile } from '@/types/profile';
import { LearnState } from '@/types/learn';
import {
  CommunityPost,
  PostReply,
  NewPostInput,
  NewReplyInput,
  PostCategory,
} from '@/types/community';

export interface ServiceResult<T> {
  data: T;
  error: null;
} | {
  data: null;
  error: string;
}

export interface IJournalRepository {
  getAll(): Promise<JournalEntry[]>;
  save(entries: JournalEntry[]): Promise<void>;
  add(entry: JournalEntry): Promise<JournalEntry[]>;
  update(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry[]>;
  remove(id: string): Promise<JournalEntry[]>;
}

export interface IMessageRepository {
  getAll(): Promise<MessageDraft[]>;
  save(drafts: MessageDraft[]): Promise<void>;
  add(draft: MessageDraft): Promise<MessageDraft[]>;
  update(id: string, updates: Partial<MessageDraft>): Promise<MessageDraft[]>;
  remove(id: string): Promise<MessageDraft[]>;
}

export interface IConversationRepository {
  getAll(): Promise<AIConversation[]>;
  save(conversations: AIConversation[]): Promise<void>;
  getById(id: string): Promise<AIConversation | null>;
  add(conversation: AIConversation): Promise<AIConversation[]>;
  update(id: string, updates: Partial<AIConversation>): Promise<AIConversation[]>;
  remove(id: string): Promise<AIConversation[]>;
}

export interface IProfileRepository {
  load(): Promise<UserProfile>;
  save(profile: UserProfile): Promise<UserProfile>;
}

export interface ILearnRepository {
  getState(): Promise<LearnState>;
  saveState(state: LearnState): Promise<void>;
}

export interface ICommunityRepository {
  getPosts(category?: PostCategory | null, search?: string): Promise<CommunityPost[]>;
  getPost(postId: string): Promise<CommunityPost | null>;
  getReplies(postId: string): Promise<PostReply[]>;
  createPost(input: NewPostInput): Promise<CommunityPost>;
  createReply(input: NewReplyInput): Promise<PostReply>;
  toggleReaction(postId: string, reactionType: string, replyId?: string): Promise<void>;
}
