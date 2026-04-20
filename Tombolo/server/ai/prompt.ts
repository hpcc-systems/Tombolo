import type {
  AssistantConversationMessage,
  AssistantRequestContext,
} from './types.js';

export function normalizeSchemaData(rawSchemaData: Record<string, unknown>) {
  const schemaData: Record<string, unknown[]> = {};
  for (const table of Object.keys(rawSchemaData || {})) {
    schemaData[table] = (
      (rawSchemaData[table] as Record<string, unknown>[]) || []
    ).map((col: Record<string, unknown>) => ({
      name: col.name,
      type: col.type,
      ...(col.keyType && { keyType: col.keyType }),
    }));
  }
  return schemaData;
}

export function sanitizeConversationHistory(
  rawHistory: Array<{ role: string; content: string }>,
  provider: string
): AssistantConversationMessage[] {
  const turnLimit = provider === 'gpt4all' ? 5 : 20;
  return (Array.isArray(rawHistory) ? rawHistory : [])
    .filter(
      message =>
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string'
    )
    .map(message => ({
      role: message.role as 'user' | 'assistant',
      content: message.content,
    }))
    .slice(-turnLimit);
}

export function buildUserPrompt(context: AssistantRequestContext): string {
  const compactKnowledgeBase =
    context.provider === 'gpt4all' ? '' : context.knowledgeBase || '(none)';

  return [
    'You are a SQL analytics assistant.',
    'Respond naturally and concisely for normal questions.',
    'Only generate SQL when the user asks for SQL/query generation.',
    'When the user asks to explain or diagnose an existing statement, explain it in plain language.',
    'For explanation or diagnostic answers, do not quote, restate, or include SQL syntax in content.',
    'If the provided statement has an issue and you can correct it, put the corrected statement in sql and keep content plain language.',
    'If Context includes a "Reference SQL to use for this reply", use that exact statement for follow-up questions.',
    'Do not switch to another statement unless the user explicitly asks for a new one.',
    'If SQL is generated: only single SELECT, no semicolon, no DML/DDL.',
    'Use only known tables/columns/relationships from schema and KB below.',
    'If user asks unknown table/column, respond exactly: OUT_OF_SCOPE: Requested table/column is not in KB',
    'If join path is unknown, respond exactly: OUT_OF_SCOPE: Relationship not defined in KB',
    '',
    ...(compactKnowledgeBase
      ? ['Knowledge Base:', compactKnowledgeBase, '']
      : []),
    'Runtime Schema:',
    JSON.stringify(context.schemaData),
    '',
    context.assistantContext ? `Context: ${context.assistantContext}` : '',
    `User request: ${context.message}`,
    '',
    'Return JSON with shape: {"content":"string","sql":"string|null"}',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildSystemPrompt(provider: string): string {
  if (provider === 'lmstudio') {
    return [
      'You are precise, safe, and schema-grounded.',
      'Never hallucinate schema.',
      'Return only valid JSON.',
      'Do not use markdown.',
      'Do not add text before or after the JSON.',
      'Format: {"content":"string","sql":"string|null"}',
    ].join(' ');
  }

  if (provider === 'gpt4all') {
    return [
      'You are precise, safe, and schema-grounded.',
      'Never hallucinate schema.',
      'Return valid JSON with keys content and sql.',
      'Keep answers short.',
    ].join(' ');
  }

  if (provider === 'openai') {
    return 'You are precise, safe, and schema-grounded. Never hallucinate schema.';
  }

  return 'You are precise, safe, and schema-grounded. Never hallucinate schema. Return valid JSON with keys content and sql.';
}
