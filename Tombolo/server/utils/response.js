import { StatusCodes } from 'http-status-codes';

/**
 * Sends a standardized JSON response to the client.
 *
 * @param {import('express').Response} res - Express response object
 * @param {Object} options - Response options
 * @param {number} [options.status=200] - HTTP status code
 * @param {boolean} [options.success=true] - Whether the request was successful
 * @param {string} [options.message=''] - Message to send
 * @param {*} [options.data=null] - Response payload
 * @param {Array<string|Error|Object>} [options.errors=[]] - Array of error messages or error objects
 * @returns {import('express').Response} Express response
 */
export const sendResponse = (
  res,
  { status = 200, success = true, message = '', data = null, errors = [] }
) => {
  const normalizedErrors = Array.isArray(errors)
    ? errors.map(e =>
        typeof e === 'string' ? e : e?.message || JSON.stringify(e)
      )
    : [
        typeof errors === 'string'
          ? errors
          : errors?.message || JSON.stringify(errors),
      ];

  return res.status(status).json({
    success,
    message,
    data,
    errors: normalizedErrors,
  });
};

/**
 * Sends a successful response to the client.
 *
 * @param {import('express').Response} res - Express response object
 * @param {*} data - Data payload
 * @param {string} [message='OK'] - Success message
 * @returns {import('express').Response} Express response
 */
export const sendSuccess = (res, data, message = 'OK', status = 200) =>
  sendResponse(res, { status, success: true, data, message, errors: [] });

/**
 * Sends an error response to the client.
 *
 * @param {import('express').Response} res - Express response object
 * @param {string|Error|Array} error - Error object or message(s)
 * @param {number} [status=500] - HTTP status code
 * @returns {import('express').Response} Express response
 */
export const sendError = (res, error, status = 500) => {
  let errorsArray;

  if (Array.isArray(error)) {
    errorsArray = error.map(e =>
      typeof e === 'string' ? e : e?.message || JSON.stringify(e)
    );
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
 *
 * @param {import('express').Response} res - Express response object
 * @param {Array<string>} errors - Array of validation error messages
 * @param {string} [message='Validation failed'] - Optional message
 * @returns {import('express').Response} Express response
 */
export const sendValidationError = (
  res,
  errors,
  message = 'Validation failed'
) => sendResponse(res, { status: 422, success: false, message, errors });

/**
 * Retrieves structured error information for known error types.
 *
 * @param {Error} error - Error object
 * @returns {{statusCode: number, message: string, name: string}} Structured error info
 */
export const getErrorInfo = error => {
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

/** @type {Record<string, {code: number, message: string}>} */
const ERROR_MAP = {
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
  UnauthorizedError: {
    code: StatusCodes.UNAUTHORIZED,
    message: 'You are not authorized to perform this action.',
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
