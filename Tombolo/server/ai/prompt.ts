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
  rawHistory: Array<{ role: string; content: string }>
): AssistantConversationMessage[] {
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
    .slice(-20);
}

export function buildUserPrompt(context: AssistantRequestContext): string {
  return [
    'You are a SQL analytics assistant.',
    'Respond naturally and concisely for normal questions.',
    'Only generate SQL when the user asks for SQL/query generation.',
    'When the user asks to explain or diagnose an existing statement, explain it in plain language.',
    'For explanation or diagnostic answers, do not quote, restate, or include SQL syntax in content.',
    'If the provided statement has an issue and you can correct it, put the corrected statement in sql and keep content plain language.',
    'If Context includes a "Reference SQL to use for this reply", use that exact statement for follow-up questions.',
    'Do not switch to another statement unless the user explicitly asks for a new one.',
    '',
    '=== SQL GENERATION RULES ===',
    'ALLOWED:',
    '  - Single SELECT statements only',
    '  - Explicit column names OR wildcards (*) for most tables',
    '  - For clusters table ONLY: must explicitly list column names (e.g., SELECT id, name, status)',
    '  - No wildcards from clusters table: SELECT * FROM clusters is FORBIDDEN',
    '  - No semicolons at the end',
    '  - No DML/DDL (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP)',
    '  - No UNION, UNION ALL, or multiple statements',
    '  - JOINs are allowed if relationships exist in schema',
    'NOT ALLOWED:',
    '  - SELECT * FROM clusters - ALWAYS specify explicit columns for clusters table',
    '  - Multiple statements',
    '  - DML/DDL operations',
    '  - UNIONs',
    '  - Semicolons',
    '',
    'For SELECT queries, choose columns that are meaningful for display.',
    'Prefer columns with simple types (string, int, date, datetime, boolean) for the result set.',
    'Avoid selecting columns with complex types (object, array, blob, json) unless explicitly requested by the user.',
    'If the user asks specifically for a column by name, include it regardless of its type.',
    'Use only known tables/columns/relationships from schema and KB below.',
    'If user asks unknown table/column, respond exactly: OUT_OF_SCOPE: Requested table/column is not in KB',
    'If join path is unknown, respond exactly: OUT_OF_SCOPE: Relationship not defined in KB',
    '',
    'Knowledge Base:',
    context.knowledgeBase || '(none)',
    '',
    'Runtime Schema (includes column types):',
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

export function buildSystemPrompt(_provider = 'azure-openai'): string {
  return 'You are precise, safe, and schema-grounded. Never hallucinate schema.';
}
