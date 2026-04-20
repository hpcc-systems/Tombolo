import axios from 'axios';
import { parseAssistantResponse } from './parser.js';
import { buildSystemPrompt, buildUserPrompt } from './prompt.js';
import type { AssistantRequestContext, AssistantResult } from './types.js';

export async function askOpenAi(
  context: AssistantRequestContext
): Promise<AssistantResult> {
  if (!context.providerConfig.apiKey) {
    throw new Error(
      'OpenAI is not configured. Set OPENAI_API_KEY on the server.'
    );
  }

  const response = await axios.post(
    `${context.providerConfig.endpoint.replace(/\/$/, '')}/chat/completions`,
    {
      model: context.model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(context.provider) },
        ...context.conversationHistory,
        { role: 'user', content: buildUserPrompt(context) },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${context.providerConfig.apiKey}`,
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
    provider: context.provider,
  };
}

export async function askOllama(
  context: AssistantRequestContext
): Promise<AssistantResult> {
  const response = await axios.post(
    `${context.providerConfig.endpoint.replace(/\/$/, '')}/api/chat`,
    {
      model: context.model,
      stream: false,
      options: { temperature: 0.1 },
      messages: [
        { role: 'system', content: buildSystemPrompt(context.provider) },
        ...context.conversationHistory,
        { role: 'user', content: buildUserPrompt(context) },
      ],
    },
    { timeout: 30000 }
  );

  const rawText =
    response?.data?.message?.content ||
    response?.data?.response ||
    'I could not generate a response right now.';

  return {
    ...parseAssistantResponse(String(rawText)),
    provider: context.provider,
  };
}

export async function askOpenAiCompatible(
  context: AssistantRequestContext
): Promise<AssistantResult> {
  const url = `${context.providerConfig.endpoint.replace(/\/$/, '')}/chat/completions`;
  const requestBody = {
    model: context.model,
    temperature: context.provider === 'gpt4all' ? 0 : 0.1,
    messages: [
      { role: 'system', content: buildSystemPrompt(context.provider) },
      ...context.conversationHistory,
      { role: 'user', content: buildUserPrompt(context) },
    ],
  };

  const response = await axios.post(url, requestBody, {
    headers: context.providerConfig.apiKey
      ? { Authorization: `Bearer ${context.providerConfig.apiKey}` }
      : undefined,
    timeout: 60000,
  });

  const rawText =
    response?.data?.choices?.[0]?.message?.content ||
    'I could not generate a response right now.';
  return {
    ...parseAssistantResponse(String(rawText)),
    provider: context.provider,
  };
}
