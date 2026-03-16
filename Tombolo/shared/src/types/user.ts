export interface AccountLocked {
  isLocked: boolean;
  lockedReason: string[];
}

export interface UserAttributes {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hash?: string | null;
  registrationMethod: string;
  verifiedUser?: boolean;
  verifiedAt?: Date | string | null;
  registrationStatus?: string;
  forcePasswordReset?: boolean;
  passwordExpiresAt?: Date | string | null;
  loginAttempts?: number;
  accountLocked?: AccountLocked | null;
  lastLoginAt?: Date | string | null;
  lastAccessedAt?: Date | string | null;
  metaData?: Record<string, any> | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;

  // Associations (included optionally when requested)
  roles?: any[];
  applications?: any[];
  refreshTokens?: any[];
}

export type UserDTO = UserAttributes;
