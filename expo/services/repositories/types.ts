import { JournalEntry, MessageDraft, CheckInEntry } from '@/types';
import { AIConversation } from '@/types/ai';
import { AuthUser, AuthSession, AuthCredentials, AuthSignUpInput } from '@/types/auth';
import { AnalyticsEvent, AnalyticsUserProperties } from '@/types/analytics';
import { UserProfile } from '@/types/profile';
import { LearnState } from '@/types/learn';
import { MemoryProfile } from '@/types/memory';
import { SubscriptionState } from '@/types/subscription';
import { TherapyPlanState } from '@/types/therapy';
import { DBTProgress } from '@/types/dbt';
import {
  CommunityPost,
  PostReply,
  NewPostInput,
  NewReplyInput,
  PostCategory,
  ReportInput,
  BlockedUser,
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
  reportContent(input: ReportInput): Promise<void>;
  blockUser(userId: string): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  getBlockedUsers(): Promise<BlockedUser[]>;
}

export interface IAuthRepository {
  getCurrentUser(): Promise<AuthUser | null>;
  getSession(): Promise<AuthSession | null>;
  signIn(credentials: AuthCredentials): Promise<AuthSession>;
  signUp(input: AuthSignUpInput): Promise<AuthSession>;
  signOut(): Promise<void>;
  refreshSession(): Promise<AuthSession | null>;
  updateUser(updates: Partial<AuthUser>): Promise<AuthUser>;
}

export interface ICheckInRepository {
  getAll(): Promise<CheckInEntry[]>;
  save(entries: CheckInEntry[]): Promise<void>;
  add(entry: CheckInEntry): Promise<CheckInEntry[]>;
  getById(id: string): Promise<CheckInEntry | null>;
  getByDateRange(start: number, end: number): Promise<CheckInEntry[]>;
  remove(id: string): Promise<CheckInEntry[]>;
}

export interface IMemoryRepository {
  getProfile(): Promise<MemoryProfile | null>;
  saveProfile(profile: MemoryProfile): Promise<void>;
  getLastUpdated(): Promise<number | null>;
  clear(): Promise<void>;
}

export interface IAnalyticsRepository {
  trackEvent(name: string, properties?: Record<string, string | number | boolean>): Promise<void>;
  setUserProperties(properties: AnalyticsUserProperties): Promise<void>;
  getEvents(): Promise<AnalyticsEvent[]>;
  flush(): Promise<void>;
}

export interface ISubscriptionRepository {
  loadState(): Promise<SubscriptionState>;
  saveState(state: SubscriptionState): Promise<void>;
  getDailyAIUsage(dateKey: string): Promise<number>;
  saveDailyAIUsage(dateKey: string, count: number): Promise<void>;
}

export interface ITherapyPlanRepository {
  loadState(): Promise<TherapyPlanState>;
  saveState(state: TherapyPlanState): Promise<void>;
}

export interface IDBTRepository {
  getProgress(): Promise<DBTProgress>;
  saveProgress(progress: DBTProgress): Promise<void>;
}

export interface ISettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
