const toNonEmptyStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(item => typeof item === 'string')
    .map(item => item.trim())
    .filter(item => item.length > 0);
};

export const getSqlErrorForToast = (error: unknown, fallbackMessage: string): string | string[] => {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error.trim();
  }

  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const candidate = error as {
    messages?: unknown;
    message?: unknown;
    raw?: { errors?: unknown; message?: unknown };
    response?: { data?: { errors?: unknown; message?: unknown } };
  };

  const messageSources = [candidate.messages, candidate.raw?.errors, candidate.response?.data?.errors];

  for (const source of messageSources) {
    const messages = toNonEmptyStringArray(source);
    if (messages.length > 0) {
      return messages;
    }
  }

  const singleMessageSources = [candidate.raw?.message, candidate.response?.data?.message, candidate.message];

  for (const source of singleMessageSources) {
    if (typeof source === 'string' && source.trim().length > 0) {
      return source.trim();
    }
  }

  return fallbackMessage;
};
