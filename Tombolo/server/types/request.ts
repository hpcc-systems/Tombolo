import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import type { Select } from 'node-sql-parser';

interface AnalyticsSqlContext {
  originalSql: string;
  normalizedSql: string;
  hadTrailingSemicolon: boolean;
  ast: Select;
}

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
  analyticsSqlContext?: AnalyticsSqlContext;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
    accessToken?: string;
    authInfo?: {
      email?: string;
    };
    analyticsSqlContext?: AnalyticsSqlContext;
  }
}
