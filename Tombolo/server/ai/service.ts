import { getAzureOpenAiConfig } from '../config/aiModels.js';
import { askAzureOpenAi } from './providers.js';
import {
  buildUserPrompt,
  normalizeSchemaData,
  sanitizeConversationHistory,
} from './prompt.js';
import type { AssistantRequestContext, AssistantResult } from './types.js';

interface BuildAssistantContextInput {
  message: string;
  assistantContext: string;
  knowledgeBase: string;
  rawSchemaData: Record<string, unknown>;
  rawHistory: Array<{ role: string; content: string }>;
}

export function buildAssistantContext(
  input: BuildAssistantContextInput
): AssistantRequestContext | null {
  const providerConfig = getAzureOpenAiConfig();
  if (!providerConfig) {
    return null;
  }

  return {
    providerConfig,
    message: input.message,
    assistantContext: input.assistantContext,
    knowledgeBase: input.knowledgeBase,
    schemaData: normalizeSchemaData(input.rawSchemaData),
    conversationHistory: sanitizeConversationHistory(input.rawHistory),
  };
}

export async function askAssistant(
  context: AssistantRequestContext
): Promise<AssistantResult> {
  return askAzureOpenAi(context);
}

export { buildUserPrompt };
