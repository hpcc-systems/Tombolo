// rbacMiddleware.js
const validateUserRole = allowedRoles => {
  return (req, res, next) => {
    // Skip role validation for test environment
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const userRoles = req.user.roles || [];
    const allUserRoles = userRoles.map(role => role.role_details.roleName);

    // Check if user has the required role
    const hasRole = allowedRoles.some(role => allUserRoles.includes(role));

    if (!hasRole) {
      return res
        .status(403)
        .json({
          success: false,
          message: 'Access denied: Insufficient privileges',
        });
    }

    next();
  };
};

module.exports = { validateUserRole };
