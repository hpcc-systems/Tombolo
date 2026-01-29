import { doubleCsrf } from 'csrf-csrf';
import jwt from 'jsonwebtoken';

import logger from '../config/logger.js';

const csrf = doubleCsrf({
  getSecret: req => {
    try {
      const token = req.cookies.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const decoded = jwt.decode(token);

      if (!decoded || !decoded.id) {
        throw new Error('Invalid token structure');
      }

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

const doubleCsrfProtection = csrf.doubleCsrfProtection;
const generateToken = csrf.generateToken;

export { doubleCsrfProtection, generateToken };
