import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface UserRoleClaims {
  role_details?: {
    roleName?: string;
  };
}

export interface AuthenticatedUser extends JwtPayload {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: UserRoleClaims[];
  tokenId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  accessToken?: string;
  authInfo?: {
    email?: string;
  };
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
    accessToken?: string;
    authInfo?: {
      email?: string;
    };
  }
}
