import { getProviderConfig } from '../config/aiModels.js';
import { askOllama, askOpenAi, askOpenAiCompatible } from './providers.js';
import {
  buildUserPrompt,
  normalizeSchemaData,
  sanitizeConversationHistory,
} from './prompt.js';
import type { AssistantRequestContext, AssistantResult } from './types.js';

interface BuildAssistantContextInput {
  provider: string;
  model: string;
  message: string;
  assistantContext: string;
  knowledgeBase: string;
  rawSchemaData: Record<string, unknown>;
  rawHistory: Array<{ role: string; content: string }>;
}

export function buildAssistantContext(
  input: BuildAssistantContextInput
): AssistantRequestContext | null {
  const providerConfig = getProviderConfig(input.provider);
  if (!providerConfig) {
    return null;
  }

  return {
    provider: input.provider,
    model: input.model,
    providerConfig,
    message: input.message,
    assistantContext: input.assistantContext,
    knowledgeBase: input.knowledgeBase,
    schemaData: normalizeSchemaData(input.rawSchemaData),
    conversationHistory: sanitizeConversationHistory(
      input.rawHistory,
      input.provider
    ),
  };
}

export async function askAssistant(
  context: AssistantRequestContext
): Promise<AssistantResult> {
  if (context.provider === 'openai') {
    return askOpenAi(context);
  }

  if (context.provider === 'ollama') {
    return askOllama(context);
  }

  if (context.providerConfig.openAiCompat) {
    return askOpenAiCompatible(context);
  }

  throw new Error(`Provider '${context.provider}' is not supported.`);
}

export { buildUserPrompt };
