const { doubleCsrf } = require('csrf-csrf');

const logger = require('../config/logger');

const csrf = doubleCsrf({
  getSecret: req => {
    try {
      const { verifyToken } = require('../utils/authUtil');
      const token = req.cookies.token;

      const decoded = verifyToken(token, process.env.JWT_SECRET);

      const secret = process.env.CSRF_SECRET + decoded.id;

      return secret;
    } catch (e) {
      logger.error('Error while getting csrf Secret: ' + e);
      throw e;
    }
  },

  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
    secure: process.env.NODE_ENV === 'production', // Enable for HTTPS in production
    httpOnly: false, //client needs to be able to read and set the cookie
  },
});

module.exports = {
  doubleCsrfProtection: csrf.doubleCsrfProtection,
  generateToken: csrf.generateToken,
};
