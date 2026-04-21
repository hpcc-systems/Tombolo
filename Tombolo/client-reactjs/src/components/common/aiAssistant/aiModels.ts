export interface AiModelOption {
  /** Provider id — sent to server to resolve endpoint + apiKey */
  provider: 'openai' | 'ollama' | 'lmstudio' | 'gpt4all';
  /** Human-readable provider name shown in the UI */
  label: string;
  /** Model identifier passed to the provider's API */
  model: string;
}

export const aiModels: AiModelOption[] = [
  {
    provider: 'openai',
    label: 'OpenAI',
    model: 'gpt-5.4',
  },
  {
    provider: 'ollama',
    label: 'Ollama',
    model: 'gpt-oss:20b',
  },
  // {
  //   provider: 'gpt4all',
  //   label: 'GPT4All',
  //   model: 'DeepSeek-R1-Distill-Llama-8B',
  // },
  {
    provider: 'lmstudio',
    label: 'LM Studio',
    model: 'qwen2.5-coder-7b',
  },
  {
    provider: 'lmstudio',
    label: 'LM Studio',
    model: 'codegemma-1.1-7b-it',
  },
];
