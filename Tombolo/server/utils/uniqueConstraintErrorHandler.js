function uniqueConstraintErrorHandler(err, defaultMessage) {
  let result = {
    responseObject: { success: false, message: defaultMessage },
    statusCode: 500,
  };
  if (err.name === 'SequelizeUniqueConstraintError') {
    result.responseObject.message = err.errors?.[0].message;
    result.statusCode = 400;
  }
  return result;
}

module.exports = {
  uniqueConstraintErrorHandler,
};
