interface ErrorHandlerResult {
  responseObject: {
    success: boolean;
    message: string;
  };
  statusCode: number;
}

interface SequelizeConstraintErrorLike {
  name: string;
  errors?: Array<{ message?: string }>;
}

const isSequelizeConstraintErrorLike = (
  value: unknown
): value is SequelizeConstraintErrorLike =>
  typeof value === 'object' && value !== null && 'name' in value;

function uniqueConstraintErrorHandler(
  err: unknown,
  defaultMessage: string
): ErrorHandlerResult {
  const result: ErrorHandlerResult = {
    responseObject: { success: false, message: defaultMessage },
    statusCode: 500,
  };
  if (
    isSequelizeConstraintErrorLike(err) &&
    err.name === 'SequelizeUniqueConstraintError'
  ) {
    result.responseObject.message =
      err.errors?.[0]?.message || result.responseObject.message;
    result.statusCode = 400;
  }
  return result;
}

export { uniqueConstraintErrorHandler };
