/**
 * Type guard to check if an error has an errors array (AggregateError)
 */
function hasErrorsArray(err: unknown): err is { errors: unknown[] } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'errors' in err &&
    Array.isArray((err as { errors: unknown }).errors)
  );
}

/**
 * Type guard to check if an error has system error properties
 */
function hasSystemErrorProperties(
  err: unknown
): err is { code?: string | number; errno?: number; syscall?: string } {
  return typeof err === 'object' && err !== null;
}

/**
 * Formats error information for logging, including support for AggregateError
 * @param err - The error to format
 * @returns Object with error details including message, stack, and individual errors for AggregateError
 */
export function formatErrorForLogging(err: unknown): {
  error: string;
  stack?: string;
  errors?: Array<{
    message: string;
    stack?: string;
    code?: string | number;
    errno?: number;
    syscall?: string;
  }>;
  code?: string | number;
  errno?: number;
  syscall?: string;
} {
  const formatted: ReturnType<typeof formatErrorForLogging> = {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  };

  // For AggregateError, log individual errors
  if (hasErrorsArray(err)) {
    formatted.errors = err.errors.map((e: unknown) => {
      const errorInfo: {
        message: string;
        stack?: string;
        code?: string | number;
        errno?: number;
        syscall?: string;
      } = {
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      };

      // Add system error properties if available
      if (hasSystemErrorProperties(e)) {
        if (e.code !== undefined) errorInfo.code = e.code;
        if (e.errno !== undefined) errorInfo.errno = e.errno;
        if (e.syscall !== undefined) errorInfo.syscall = e.syscall;
      }

      return errorInfo;
    });
  }

  // Add error code properties if available
  if (hasSystemErrorProperties(err)) {
    if (err.code !== undefined) formatted.code = err.code;
    if (err.errno !== undefined) formatted.errno = err.errno;
    if (err.syscall !== undefined) formatted.syscall = err.syscall;
  }

  return formatted;
}
