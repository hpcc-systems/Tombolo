import axios from 'axios';
import { parseAssistantResponse } from './parser.js';
import { buildSystemPrompt, buildUserPrompt } from './prompt.js';
import type { AssistantRequestContext, AssistantResult } from './types.js';

export async function askAzureOpenAi(
  context: AssistantRequestContext
): Promise<AssistantResult> {
  const requestUrl =
    `${context.providerConfig.endpoint}/openai/deployments/${encodeURIComponent(context.providerConfig.deployment)}/chat/completions` +
    `?api-version=${encodeURIComponent(context.providerConfig.apiVersion)}`;

  const response = await axios.post(
    requestUrl,
    {
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        ...context.conversationHistory,
        { role: 'user', content: buildUserPrompt(context) },
      ],
    },
    {
      headers: {
        'api-key': context.providerConfig.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const rawText =
    response?.data?.choices?.[0]?.message?.content ||
    'I could not generate a response right now.';

  return {
    ...parseAssistantResponse(String(rawText)),
    provider: 'azure-openai',
  };
}
