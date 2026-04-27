import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import CustomError from './customError.js';

interface ResponseOptions {
  status?: number;
  success?: boolean;
  message?: string;
  data?: unknown;
  errors?: ErrorValue | ErrorValue[];
}

interface ErrorInfo {
  statusCode: number;
  message: string;
  name: string;
}

interface ErrorMapEntry {
  code: number;
  message: string;
}

type ErrorValue = string | Error | Record<string, unknown>;

interface StructuredErrorPayload {
  message: string;
  data?: unknown;
  errors?: ErrorValue[];
}

const getErrorMessage = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  if (value && typeof value === 'object' && 'message' in value) {
    const maybeMessage = (value as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  return JSON.stringify(value);
};

/**
 * Sends a standardized JSON response to the client.
 */
const sendResponse = (
  res: Response,
  {
    status = 200,
    success = true,
    message = '',
    data = null,
    errors = [],
  }: ResponseOptions
): Response => {
  const normalizedErrors = Array.isArray(errors)
    ? errors.map(e => getErrorMessage(e))
    : [getErrorMessage(errors)];

  return res.status(status).json({
    success,
    message,
    data,
    errors: normalizedErrors,
  });
};

/**
 * Sends a successful response to the client.
 */
const sendSuccess = (
  res: Response,
  data: unknown,
  message = 'OK',
  status = 200
): Response =>
  sendResponse(res, { status, success: true, data, message, errors: [] });

/**
 * Sends an error response to the client.
 */
const sendError = (
  res: Response,
  error: string | Error | Array<string | Error> | StructuredErrorPayload,
  status = 500
): Response => {
  let errorsArray: string[];

  if (
    typeof error === 'object' &&
    error !== null &&
    !Array.isArray(error) &&
    !(error instanceof Error) &&
    'message' in error
  ) {
    const payload = error as StructuredErrorPayload;
    const normalizedErrors = (payload.errors || [payload.message]).map(e =>
      getErrorMessage(e)
    );

    return sendResponse(res, {
      status,
      success: false,
      message: payload.message,
      data: payload.data ?? null,
      errors: normalizedErrors,
    });
  }

  if (Array.isArray(error)) {
    errorsArray = error?.map(e => getErrorMessage(e));
  } else if (typeof error === 'string') {
    errorsArray = [error];
  } else if (error instanceof Error) {
    const errorInfo = getErrorInfo(error);

    return sendResponse(res, {
      status: errorInfo.statusCode,
      success: false,
      message: errorInfo.message,
      errors: [errorInfo.message],
    });
  } else {
    errorsArray = [JSON.stringify(error)];
  }

  return sendResponse(res, {
    status,
    success: false,
    message: errorsArray[0] || 'An error occurred',
    errors: errorsArray,
  });
};

/**
 * Sends a validation error response to the client.
 */
const sendValidationError = (
  res: Response,
  errors: string[],
  message = 'Validation failed'
): Response =>
  sendResponse(res, { status: 422, success: false, message, errors });

/**
 * Retrieves structured error information for known error types.
 */
const getErrorInfo = (error: Error): ErrorInfo => {
  if (error instanceof CustomError) {
    let errorName = 'CustomError';
    if (error.message.toLowerCase().includes('not found')) {
      errorName = 'NotFoundError';
    }

    return {
      statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      message: error.message,
      name: errorName,
    };
  }

  if (!(error instanceof Error)) {
    return {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Unknown error occurred.',
      name: 'UnknownError',
    };
  }

  const { name } = error;
  const info = ERROR_MAP[name];
  if (info) {
    return {
      statusCode: info.code,
      message: info.message,
      name,
    };
  }

  return {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred. Please try again later.',
    name,
  };
};

const ERROR_MAP: Record<string, ErrorMapEntry> = {
  UnauthorizedError: {
    code: StatusCodes.UNAUTHORIZED,
    message: 'Invalid credentials provided.',
  },
  EvalError: {
    code: StatusCodes.BAD_REQUEST,
    message: 'Evaluation error occurred.',
  },
  RangeError: {
    code: StatusCodes.BAD_REQUEST,
    message: 'Value out of allowed range.',
  },
  ReferenceError: {
    code: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'Reference missing in code.',
  },
  SyntaxError: {
    code: StatusCodes.BAD_REQUEST,
    message: 'Malformed request or invalid syntax.',
  },
  TypeError: {
    code: StatusCodes.BAD_REQUEST,
    message: 'Type mismatch detected.',
  },
  URIError: { code: StatusCodes.BAD_REQUEST, message: 'Invalid URI format.' },

  AssertionError: {
    code: StatusCodes.BAD_REQUEST,
    message: 'Assertion failed.',
  },
  ForbiddenError: {
    code: StatusCodes.FORBIDDEN,
    message: 'Access to this resource is forbidden.',
  },
  NotFoundError: {
    code: StatusCodes.NOT_FOUND,
    message: 'The requested resource could not be found.',
  },
  ConflictError: {
    code: StatusCodes.CONFLICT,
    message: 'Resource conflict detected.',
  },
  TooManyRequestsError: {
    code: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Too many requests. Please try later.',
  },
  RequestTimeoutError: {
    code: StatusCodes.REQUEST_TIMEOUT,
    message: 'Request timed out.',
  },

  SequelizeValidationError: {
    code: StatusCodes.BAD_REQUEST,
    message: 'Invalid data or constraint violation.',
  },
  SequelizeUniqueConstraintError: {
    code: StatusCodes.CONFLICT,
    message: 'Duplicate record detected.',
  },
  SequelizeForeignKeyConstraintError: {
    code: StatusCodes.BAD_REQUEST,
    message: 'Invalid related record.',
  },
  SequelizeDatabaseError: {
    code: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'Database error occurred.',
  },
  SequelizeConnectionError: {
    code: StatusCodes.SERVICE_UNAVAILABLE,
    message: 'Database connection unavailable.',
  },
};

export { sendResponse, sendSuccess, sendError, sendValidationError };
