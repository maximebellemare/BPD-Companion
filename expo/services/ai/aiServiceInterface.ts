import { AIServiceResponse, AIServiceConfig } from '@/types/ai';

export interface IAIService {
  generateResponse(
    userMessage: string,
    contextSummary?: string,
  ): Promise<AIServiceResponse>;

  generateConversationTitle(firstMessage: string): string;
}

export interface IAIServiceFactory {
  create(config: AIServiceConfig): IAIService;
}

class MockAIServiceAdapter implements IAIService {
  private generateFn: (msg: string, ctx?: string) => Promise<AIServiceResponse>;
  private titleFn: (msg: string) => string;

  constructor(
    generateFn: (msg: string, ctx?: string) => Promise<AIServiceResponse>,
    titleFn: (msg: string) => string,
  ) {
    this.generateFn = generateFn;
    this.titleFn = titleFn;
  }

  async generateResponse(
    userMessage: string,
    contextSummary?: string,
  ): Promise<AIServiceResponse> {
    return this.generateFn(userMessage, contextSummary);
  }

  generateConversationTitle(firstMessage: string): string {
    return this.titleFn(firstMessage);
  }
}

export function createAIService(config: AIServiceConfig): IAIService {
  switch (config.provider) {
    case 'mock': {
      if (!__DEV__) {
        throw new Error('Mock AI is disabled in production.');
      }
      const { generateMockResponse, generateConversationTitle } = require('@/services/ai/mockAIService');
      return new MockAIServiceAdapter(generateMockResponse, generateConversationTitle);
    }
    case 'openai':
    case 'anthropic':
    case 'custom':
      throw new Error('Companion is temporarily unavailable. Please try again later.');
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

export const defaultAIService: IAIService | null = __DEV__ ? createAIService({ provider: 'mock' }) : null;
