import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import { setTokenCookie } from '../utils/authUtil.js';
import { isTokenBlacklisted } from '../utils/tokenBlackListing.js';
import { AuthenticatedUser } from '../types/request.js';

// Main middleware function
const tokenValidationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    // Verify and decode token
    const decoded = await verifyToken(token, process.env.JWT_SECRET!);

    if (typeof decoded === 'string') {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    req.user = decoded;

    // If token is blacklisted - return unauthorized
    if (decoded.tokenId && isTokenBlacklisted(decoded.tokenId)) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: Token no longer valid' });
    }

    // Refresh token cookie (extend expiry)
    setTokenCookie(res, token);

    next();
  } catch (err) {
    // For any token error (expired, invalid, etc.) - return 401
    // Client will handle refresh via interceptor
    return res.status(401).json({
      message:
        err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
    });
  }
};

// Function to verify token
const verifyToken = (
  token: string,
  secret: string
): Promise<AuthenticatedUser | string> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as AuthenticatedUser | string);
      }
    });
  });
};

// Refresh token logic moved to authController.js - refreshAccessToken method

export { tokenValidationMiddleware };
