import { sendError } from '../utils/response.js';

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
      return sendError(res, 'Access denied: Insufficient privileges', 403);
    }
    next();
  };
};

export { validateUserRole };
