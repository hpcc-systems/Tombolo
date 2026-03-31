import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../test_server.js';
import { mockedModels } from '../mockedModels.js';
import { blacklistTokenIntervalId } from '../../utils/tokenBlackListing.js';
import {
  getUsers,
  getInstanceSettings,
  getSentNotification,
  getLoginPayload,
  nonExistentID,
} from '../helpers.js';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

const getUser = () => getUsers()[0];

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    if (blacklistTokenIntervalId) {
      clearInterval(blacklistTokenIntervalId as NodeJS.Timeout);
    }
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('basic-login Should log in a user', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);

    mockedModels.User.findOne.mockResolvedValue({
      ...user,
      toJSON: () => ({ ...user }),
    });
    mockedModels.RefreshToken.create.mockResolvedValue(true);
    mockedModels.User.update.mockResolvedValue([1]);

    const res = await request(app)
      .post('/api/auth/loginBasicUser')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('success');
    const cookiesHeader = res.headers['set-cookie'];
    const cookies = Array.isArray(cookiesHeader)
      ? cookiesHeader
      : cookiesHeader
        ? [cookiesHeader]
        : [];
    expect(cookies).toBeDefined();
    const tokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith('token=')
    );
    expect(tokenCookie?.split(';')[0].split('=')[1]).toBeDefined();
    expect(mockedModels.User.findOne).toHaveBeenCalled();
    expect(mockedModels.RefreshToken.create).toHaveBeenCalled();
    expect(mockedModels.User.update).toHaveBeenCalled();
  });

  it('basic-login should 401 if user with email does not exist', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);

    mockedModels.User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/loginBasicUser')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe(
      'User with the provided email and password combination not found'
    );
    expect(res.body.success).toBe(false);
    expect(mockedModels.User.findOne).toHaveBeenCalled();
    expect(mockedModels.RefreshToken.create).not.toHaveBeenCalled();
    expect(mockedModels.User.update).not.toHaveBeenCalled();
  });

  it('basic-login should 401 if user unverified', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);
    user.verifiedUser = false;

    mockedModels.User.findOne.mockResolvedValue(user);

    const res = await request(app)
      .post('/api/auth/loginBasicUser')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('unverified');
    expect(res.body.success).toBe(false);
    expect(mockedModels.User.findOne).toHaveBeenCalled();
    expect(mockedModels.RefreshToken.create).not.toHaveBeenCalled();
    expect(mockedModels.User.update).not.toHaveBeenCalled();
  });

  it('basic-login should 401 if user is registered with azure', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);
    user.registrationMethod = 'azure';

    mockedModels.User.findOne.mockResolvedValue({
      ...user,
      toJSON: () => ({ ...user }),
    });

    const res = await request(app)
      .post('/api/auth/loginBasicUser')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe(
      'Email is registered with a Microsoft account. Please sign in with Microsoft'
    );
    expect(res.body.success).toBe(false);
    expect(mockedModels.User.findOne).toHaveBeenCalled();
    expect(mockedModels.RefreshToken.create).not.toHaveBeenCalled();
    expect(mockedModels.User.update).not.toHaveBeenCalled();
  });

  it('basic-login should 401 if account is locked', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);
    user.accountLocked.isLocked = true;

    mockedModels.User.findOne.mockResolvedValue(user);

    const res = await request(app)
      .post('/api/auth/loginBasicUser')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe(
      'Your account is locked. Please contact your administrator to regain access'
    );
    expect(res.body.success).toBe(false);
    expect(mockedModels.User.findOne).toHaveBeenCalled();
    expect(mockedModels.RefreshToken.create).not.toHaveBeenCalled();
    expect(mockedModels.User.update).not.toHaveBeenCalled();
  });

  it('request-access should request access', async () => {
    const user = getUser();
    const instanceSettings = {
      ...getInstanceSettings()[0],
      metaData: {
        ...getInstanceSettings()[0].metaData,
        accessRequestEmailRecipientsEmail: ['admin@example.com'],
        accessRequestEmailRecipientsRoles: [],
      },
    }; // findOne returns a single object in these tests
    mockedModels.User.findOne.mockResolvedValue(user);
    mockedModels.InstanceSettings.findOne.mockResolvedValue(instanceSettings);
    mockedModels.SentNotification.findOne.mockResolvedValue(null);
    mockedModels.NotificationQueue.create.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/requestAccess')
      .send({ id: user.id, comment: 'Please', roles: [], applications: [] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access requested successfully');
    expect(mockedModels.User.findOne).toHaveBeenCalled();
    expect(mockedModels.InstanceSettings.findOne).toHaveBeenCalled();
    expect(mockedModels.SentNotification.findOne).toHaveBeenCalled();
    expect(mockedModels.NotificationQueue.create).toHaveBeenCalled();
  });

  it('request-access should request access if existingNotification >24 hours', async () => {
    const user = getUser();
    const instanceSettings = {
      ...getInstanceSettings()[0],
      metaData: {
        ...getInstanceSettings()[0].metaData,
        accessRequestEmailRecipientsEmail: ['admin@example.com'],
        accessRequestEmailRecipientsRoles: [],
      },
    }; // findOne returns a single object in these tests
    const sentNotification = getSentNotification();
    sentNotification.createdAt = moment()
      .subtract(25, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    mockedModels.User.findOne.mockResolvedValue(user);
    mockedModels.InstanceSettings.findOne.mockResolvedValue(instanceSettings);
    mockedModels.SentNotification.findOne.mockResolvedValue(sentNotification);
    mockedModels.NotificationQueue.create.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/requestAccess')
      .send({ id: user.id, comment: 'Please', roles: [], applications: [] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access requested successfully');
    expect(mockedModels.User.findOne).toHaveBeenCalled();
    expect(mockedModels.InstanceSettings.findOne).toHaveBeenCalled();
    expect(mockedModels.SentNotification.findOne).toHaveBeenCalled();
    expect(mockedModels.NotificationQueue.create).toHaveBeenCalled();
  });

  it('request-access should 404 if user does not exist', async () => {
    mockedModels.User.findOne.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/requestAccess').send({
      id: nonExistentID,
      comment: 'Please',
      roles: [],
      applications: [],
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
    expect(mockedModels.User.findOne).toHaveBeenCalled();
    expect(mockedModels.InstanceSettings.findOne).not.toHaveBeenCalled();
    expect(mockedModels.SentNotification.findOne).not.toHaveBeenCalled();
  });

  it('request-access should not send another request in <24 hours', async () => {
    const user = getUser();
    const instanceSettings = {
      ...getInstanceSettings()[0],
      metaData: {
        ...getInstanceSettings()[0].metaData,
        accessRequestEmailRecipientsEmail: ['admin@example.com'],
        accessRequestEmailRecipientsRoles: [],
      },
    }; // findOne returns a single object in these tests
    const sentNotification = getSentNotification();
    sentNotification.createdAt = moment()
      .subtract(7, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    mockedModels.User.findOne.mockResolvedValue(user);
    mockedModels.InstanceSettings.findOne.mockResolvedValue(instanceSettings);
    mockedModels.SentNotification.findOne.mockResolvedValue(sentNotification);

    const res = await request(app)
      .post('/api/auth/requestAccess')
      .send({ id: user.id, comment: 'Please', roles: [], applications: [] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access request already sent');
    expect(mockedModels.User.findOne).toHaveBeenCalled();
    expect(mockedModels.InstanceSettings.findOne).toHaveBeenCalled();
    expect(mockedModels.SentNotification.findOne).toHaveBeenCalled();
    expect(mockedModels.NotificationQueue.create).not.toHaveBeenCalled();
  });

  describe('refresh-token endpoint', () => {
    const user = getUser();
    const tokenId = uuidv4();
    const refreshTokenExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const createValidToken = (expired = false) => {
      const tokenData = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        tokenId,
      };

      return jwt.sign(
        tokenData,
        JWT_SECRET,
        { expiresIn: expired ? '-1h' : '15m' } // Expired or valid token
      );
    };

    const createRefreshTokenRecord = () => ({
      id: tokenId,
      userId: user.id,
      token: 'mock-refresh-token',
      deviceInfo: 'test-device',
      iat: new Date(),
      exp: refreshTokenExp,
      destroy: vi.fn().mockResolvedValue(true),
    });

    it('should refresh token successfully with expired access token', async () => {
      const expiredToken = createValidToken(true);
      const refreshTokenRecord = createRefreshTokenRecord();

      mockedModels.RefreshToken.findOne.mockResolvedValue(refreshTokenRecord);
      mockedModels.RefreshToken.create.mockResolvedValue(true);
      mockedModels.User.findOne.mockResolvedValue({
        ...user,
        toJSON: () => ({ ...user }),
      });

      const res = await request(app)
        .post('/api/auth/refreshToken')
        .set('Cookie', [`token=${expiredToken}`])
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Token refreshed successfully');

      // Account for transformations in controller: hash removed, date serialized
      const { hash: _hash, passwordExpiresAt, ...restUser } = user;
      const expectedUser = {
        ...restUser,
        passwordExpiresAt: passwordExpiresAt.toISOString(),
      };
      expect(res.body.data.user).toEqual(expectedUser);

      // Verify refresh token operations
      expect(mockedModels.RefreshToken.findOne).toHaveBeenCalledWith({
        where: { id: tokenId },
      });
      expect(mockedModels.RefreshToken.create).toHaveBeenCalled();
      expect(refreshTokenRecord.destroy).toHaveBeenCalled();

      // Verify new token is set in cookie
      expect(res.headers['set-cookie']).toBeDefined();
      const setCookieHeader = res.headers['set-cookie'];
      const setCookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : setCookieHeader
          ? [setCookieHeader]
          : [];
      expect(
        setCookies.some((cookie: string) => cookie.includes('token='))
      ).toBe(true);
    });

    it('should refresh token successfully with valid access token', async () => {
      const validToken = createValidToken(false);
      const refreshTokenRecord = createRefreshTokenRecord();

      mockedModels.RefreshToken.findOne.mockResolvedValue(refreshTokenRecord);
      mockedModels.RefreshToken.create.mockResolvedValue(true);
      mockedModels.User.findOne.mockResolvedValue({
        ...user,
        toJSON: () => ({ ...user }),
      });

      const res = await request(app)
        .post('/api/auth/refreshToken')
        .set('Cookie', [`token=${validToken}`])
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Token refreshed successfully');
    });

    it('should return 401 when refresh token not found in database', async () => {
      const expiredToken = createValidToken(true);

      mockedModels.RefreshToken.findOne.mockResolvedValue(null); // No refresh token found

      const res = await request(app)
        .post('/api/auth/refreshToken')
        .set('Cookie', [`token=${expiredToken}`])
        .send();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Session expired');
    });

    it('should return 401 when refresh token session has expired', async () => {
      const expiredToken = createValidToken(true);
      const expiredRefreshTokenRecord = {
        ...createRefreshTokenRecord(),
        exp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
      };

      mockedModels.RefreshToken.findOne.mockResolvedValue(
        expiredRefreshTokenRecord
      );

      const res = await request(app)
        .post('/api/auth/refreshToken')
        .set('Cookie', [`token=${expiredToken}`])
        .send();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Session expired');
      expect(expiredRefreshTokenRecord.destroy).toHaveBeenCalled();
    });

    it('should return 401 when user not found', async () => {
      const expiredToken = createValidToken(true);
      const refreshTokenRecord = createRefreshTokenRecord();

      mockedModels.RefreshToken.findOne.mockResolvedValue(refreshTokenRecord);
      mockedModels.User.findOne.mockResolvedValue(null); // User not found

      const res = await request(app)
        .post('/api/auth/refreshToken')
        .set('Cookie', [`token=${expiredToken}`])
        .send();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should return 401 for invalid token structure', async () => {
      const invalidToken = jwt.sign(
        { missingTokenId: true }, // Missing required tokenId
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .post('/api/auth/refreshToken')
        .set('Cookie', [`token=${invalidToken}`])
        .send();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid token structure');
    });

    it('should return 401 for completely invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/refreshToken')
        .set('Cookie', ['token=invalid-jwt-token'])
        .send();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid refresh token');
    });

    it('should return 401 when no token cookie provided', async () => {
      const res = await request(app).post('/api/auth/refreshToken').send();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
