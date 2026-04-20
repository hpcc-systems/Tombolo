/**
 * Unified AI provider configuration.
 * All secrets come from environment variables — never hardcoded here.
 *
 * To add a new provider, append an entry to AI_PROVIDERS and add the
 * corresponding env vars to your .env file.
 */

export type AiProvider = 'openai' | 'ollama' | 'lmstudio' | 'gpt4all';

export interface AiProviderConfig {
  /** Canonical provider id — must match what the client sends */
  provider: AiProvider;
  /** Base URL for the provider's API */
  endpoint: string;
  /** API key, or null for local providers that don't need one */
  apiKey: string | null;
  /** Whether the provider supports OpenAI-style chat/completions API */
  openAiCompat: boolean;
}

export const AI_PROVIDERS: AiProviderConfig[] = [
  {
    provider: 'openai',
    endpoint: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || null,
    openAiCompat: true,
  },
  {
    provider: 'ollama',
    endpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    apiKey: null,
    openAiCompat: false, // uses /api/chat
  },
  {
    provider: 'lmstudio',
    endpoint: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1',
    apiKey: null,
    openAiCompat: true,
  },
  {
    provider: 'gpt4all',
    endpoint: process.env.GPT4ALL_BASE_URL || 'http://localhost:4891/v1',
    apiKey: null,
    openAiCompat: true,
  },
];

/** Look up provider config by provider id. Returns null if not found. */
export const getProviderConfig = (provider: string): AiProviderConfig | null =>
  AI_PROVIDERS.find(p => p.provider === provider) ?? null;
