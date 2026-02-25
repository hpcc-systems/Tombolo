interface ErrorHandlerResult {
  responseObject: {
    success: boolean;
    message: string;
  };
  statusCode: number;
}

function uniqueConstraintErrorHandler(
  err: any,
  defaultMessage: string
): ErrorHandlerResult {
  let result: ErrorHandlerResult = {
    responseObject: { success: false, message: defaultMessage },
    statusCode: 500,
  };
  if (err.name === 'SequelizeUniqueConstraintError') {
    result.responseObject.message = err.errors?.[0].message;
    result.statusCode = 400;
  }
  return result;
}

export { uniqueConstraintErrorHandler };
