export interface AiProviderConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, '');
}

export function getAzureOpenAiConfig(): AiProviderConfig | null {
  const endpoint = String(process.env.AZURE_OPENAI_ENDPOINT || '').trim();
  const apiKey = String(process.env.AZURE_OPENAI_API_KEY || '').trim();
  const deployment = String(process.env.AZURE_OPENAI_DEPLOYMENT || '').trim();
  const apiVersion = String(process.env.AZURE_OPENAI_API_VERSION || '').trim();

  if (!endpoint || !apiKey || !deployment || !apiVersion) {
    return null;
  }

  return {
    endpoint: normalizeEndpoint(endpoint),
    apiKey,
    deployment,
    apiVersion,
  };
}
