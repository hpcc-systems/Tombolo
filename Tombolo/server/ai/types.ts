import type { AiProviderConfig } from '../config/aiModels.js';

export interface AssistantConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantRequestContext {
  provider: string;
  model: string;
  providerConfig: AiProviderConfig;
  message: string;
  assistantContext: string;
  knowledgeBase: string;
  schemaData: Record<string, unknown[]>;
  conversationHistory: AssistantConversationMessage[];
}

export interface AssistantResult {
  content: string;
  sql: string | null;
  provider: string;
}
