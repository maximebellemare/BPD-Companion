export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
  saved: boolean;
  preview: string;
  tags: string[];
}

export interface AIConversationSummary {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
  messageCount: number;
  tags: string[];
  saved: boolean;
}

export interface SupportiveInterpretation {
  id: string;
  text: string;
  category: 'trigger' | 'coping' | 'emotion' | 'relationship' | 'pattern';
  sentiment: 'gentle' | 'encouraging' | 'observational';
}

export interface AIServiceResponse {
  content: string;
  timestamp: number;
}

export interface SuggestedPrompt {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export interface AIServiceConfig {
  provider: 'mock' | 'openai' | 'anthropic' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}
