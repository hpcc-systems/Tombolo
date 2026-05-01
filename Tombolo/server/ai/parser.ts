import type { AssistantResult } from './types.js';

export function extractSqlFromText(text: string): string | null {
  const fencedMatch = text.match(/```sql\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const selectMatch = text.match(/\bselect\b[\s\S]*?(?=(?:\n\n|$))/i);
  return selectMatch?.[0]?.trim() || null;
}

export function stripSqlFences(text: string): string {
  return text.replace(/```sql\s*[\s\S]*?```/gi, '').trim();
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

export function extractJsonFromFences(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (jsonMatch?.[1]) {
    return jsonMatch[1].trim();
  }

  const genericMatch = text.match(/```\s*([\s\S]*?)```/i);
  if (genericMatch?.[1] && genericMatch[1].trim().startsWith('{')) {
    return genericMatch[1].trim();
  }

  const withoutSpecialTokens = text.replace(/<\|[^|>]+\|>/g, ' ').trim();
  return extractFirstJsonObject(withoutSpecialTokens) || withoutSpecialTokens;
}

export function parseAssistantResponse(
  rawText: string
): Omit<AssistantResult, 'provider'> {
  let parsed: { content?: string; sql?: string | null } | null = null;
  try {
    parsed = JSON.parse(extractJsonFromFences(rawText));
  } catch {
    parsed = null;
  }

  const content =
    parsed?.content ||
    (typeof rawText === 'string'
      ? stripSqlFences(rawText)
      : 'I could not parse response.');
  const sqlCandidate = parsed?.sql || extractSqlFromText(rawText);

  return {
    content,
    sql: sqlCandidate || null,
  };
}
