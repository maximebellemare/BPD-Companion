import { storageService } from '@/services/storage/storageService';
import { LocalJournalRepository } from './journalRepository';
import { LocalMessageRepository } from './messageRepository';
import { LocalConversationRepository } from './conversationRepository';
import { LocalProfileRepository } from './profileRepository';
import { LocalLearnRepository } from './learnRepository';
import { LocalCommunityRepository } from './communityRepository';
import { LocalAuthRepository } from './authRepository';
import { LocalCheckInRepository } from './checkInRepository';
import { LocalMemoryRepository } from './memoryRepository';
import { LocalAnalyticsRepository } from './analyticsRepository';
import { LocalRitualRepository } from './ritualRepository';
import { LocalSubscriptionRepository } from './subscriptionRepository';
import { LocalTherapyPlanRepository } from './therapyPlanRepository';
import { LocalDBTRepository } from './dbtRepository';
import { LocalSettingsRepository } from './settingsRepository';
import { LocalDailyRitualsRepository } from './dailyRitualsRepository';
import {
  IJournalRepository,
  IMessageRepository,
  IConversationRepository,
  IProfileRepository,
  ILearnRepository,
  ICommunityRepository,
  IAuthRepository,
  ICheckInRepository,
  IMemoryRepository,
  IAnalyticsRepository,
  ISubscriptionRepository,
  ITherapyPlanRepository,
  IDBTRepository,
  ISettingsRepository,
} from './types';
import { IRitualRepository } from './ritualRepository';

export const journalRepository: IJournalRepository = new LocalJournalRepository(storageService);
export const messageRepository: IMessageRepository = new LocalMessageRepository(storageService);
export const conversationRepository: IConversationRepository = new LocalConversationRepository(storageService);
export const profileRepository: IProfileRepository = new LocalProfileRepository(storageService);
export const learnRepository: ILearnRepository = new LocalLearnRepository(storageService);
export const communityRepository: ICommunityRepository = new LocalCommunityRepository();
export const authRepository: IAuthRepository = new LocalAuthRepository(storageService);
export const checkInRepository: ICheckInRepository = new LocalCheckInRepository(storageService);
export const memoryRepository: IMemoryRepository = new LocalMemoryRepository(storageService);
export const analyticsRepository: IAnalyticsRepository = new LocalAnalyticsRepository();
export const ritualRepository: IRitualRepository = new LocalRitualRepository(storageService);
export const subscriptionRepository: ISubscriptionRepository = new LocalSubscriptionRepository(storageService);
export const therapyPlanRepository: ITherapyPlanRepository = new LocalTherapyPlanRepository(storageService);
export const dbtRepository: IDBTRepository = new LocalDBTRepository(storageService);
export const settingsRepository: ISettingsRepository = new LocalSettingsRepository(storageService);
export const dailyRitualsRepository = new LocalDailyRitualsRepository(storageService);

export type {
  IJournalRepository,
  IMessageRepository,
  IConversationRepository,
  IProfileRepository,
  ILearnRepository,
  ICommunityRepository,
  IAuthRepository,
  ICheckInRepository,
  IMemoryRepository,
  IAnalyticsRepository,
  ISubscriptionRepository,
  ITherapyPlanRepository,
  IDBTRepository,
  ISettingsRepository,
} from './types';
export type { IRitualRepository } from './ritualRepository';
export type { IDailyRitualsRepository } from './dailyRitualsRepository';
