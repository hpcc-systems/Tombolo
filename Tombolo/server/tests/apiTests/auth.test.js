import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../test_server.js';
import {
  SentNotification,
  User,
  InstanceSettings,
  NotificationQueue,
  RefreshToken,
} from '../../models/index.js';
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

const getUser = () => getUsers()[0];

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('basic-login Should log in a user', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);

    User.findOne.mockResolvedValue({
      ...user,
      toJSON: () => ({ ...user }),
    });
    RefreshToken.create.mockResolvedValue(true);
    User.update.mockResolvedValue([1]);

    const res = await request(app)
      .post('/api/auth/loginBasicUser')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('success');
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(
      cookies
        .find(cookie => cookie.startsWith('token='))
        .split(';')[0]
        .split('=')[1]
    ).toBeDefined();
    expect(User.findOne).toHaveBeenCalled();
    expect(RefreshToken.create).toHaveBeenCalled();
    expect(User.update).toHaveBeenCalled();
  });

  it('basic-login should 401 if user with email does not exist', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);

    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/loginBasicUser')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe(
      'User with the provided email and password combination not found'
    );
    expect(res.body.success).toBe(false);
    expect(User.findOne).toHaveBeenCalled();
    expect(RefreshToken.create).not.toHaveBeenCalled();
    expect(User.update).not.toHaveBeenCalled();
  });

  it('basic-login should 401 if user unverified', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);
    user.verifiedUser = false;

    User.findOne.mockResolvedValue(user);

    const res = await request(app)
      .post('/api/auth/loginBasicUser')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('unverified');
    expect(res.body.success).toBe(false);
    expect(User.findOne).toHaveBeenCalled();
    expect(RefreshToken.create).not.toHaveBeenCalled();
    expect(User.update).not.toHaveBeenCalled();
  });

  it('basic-login should 401 if user is registered with azure', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);
    user.registrationMethod = 'azure';

    User.findOne.mockResolvedValue({
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
    expect(User.findOne).toHaveBeenCalled();
    expect(RefreshToken.create).not.toHaveBeenCalled();
    expect(User.update).not.toHaveBeenCalled();
  });

  it('basic-login should 401 if account is locked', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);
    user.accountLocked.isLocked = true;

    User.findOne.mockResolvedValue(user);

    const res = await request(app)
      .post('/api/auth/loginBasicUser')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe(
      'Your account is locked. Please contact your administrator to regain access'
    );
    expect(res.body.success).toBe(false);
    expect(User.findOne).toHaveBeenCalled();
    expect(RefreshToken.create).not.toHaveBeenCalled();
    expect(User.update).not.toHaveBeenCalled();
  });

  it('request-access should request access', async () => {
    const user = getUser();
    const instanceSettings = getInstanceSettings()[0]; // Get first item since findOne returns single object
    instanceSettings.metaData = {
      description: 'This is for local dev',
      accessRequestEmailRecipientsEmail: ['admin@example.com'], // Ensure recipients exist
      // Remove accessRequestEmailRecipientsRoles to avoid unmocked DB queries
    };
    User.findOne.mockResolvedValue(user);
    InstanceSettings.findOne.mockResolvedValue(instanceSettings);
    SentNotification.findOne.mockResolvedValue(null);
    NotificationQueue.create.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/requestAccess')
      .send({ id: user.id, comment: 'Please', roles: [], applications: [] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access requested successfully');
    expect(User.findOne).toHaveBeenCalled();
    expect(InstanceSettings.findOne).toHaveBeenCalled();
    expect(SentNotification.findOne).toHaveBeenCalled();
    expect(NotificationQueue.create).toHaveBeenCalled();
  });

  it('request-access should request access if existingNotification >24 hours', async () => {
    const user = getUser();
    const instanceSettings = getInstanceSettings()[0]; // Get first item since findOne returns single object
    instanceSettings.metaData = {
      description: 'This is for local dev',
      accessRequestEmailRecipientsEmail: ['admin@example.com'], // Ensure recipients exist
      // Remove accessRequestEmailRecipientsRoles to avoid unmocked DB queries
    };
    const sentNotification = getSentNotification();
    sentNotification.createdAt = moment()
      .subtract(25, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    User.findOne.mockResolvedValue(user);
    InstanceSettings.findOne.mockResolvedValue(instanceSettings);
    SentNotification.findOne.mockResolvedValue(sentNotification);
    NotificationQueue.create.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/requestAccess')
      .send({ id: user.id, comment: 'Please', roles: [], applications: [] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access requested successfully');
    expect(User.findOne).toHaveBeenCalled();
    expect(InstanceSettings.findOne).toHaveBeenCalled();
    expect(SentNotification.findOne).toHaveBeenCalled();
    expect(NotificationQueue.create).toHaveBeenCalled();
  });

  it('request-access should 404 if user does not exist', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/requestAccess').send({
      id: nonExistentID,
      comment: 'Please',
      roles: [],
      applications: [],
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
    expect(User.findOne).toHaveBeenCalled();
    expect(InstanceSettings.findOne).not.toHaveBeenCalled();
    expect(SentNotification.findOne).not.toHaveBeenCalled();
  });

  it('request-access should not send another request in <24 hours', async () => {
    const user = getUser();
    const instanceSettings = getInstanceSettings()[0]; // Get first item since findOne returns single object
    instanceSettings.metaData = {
      description: 'This is for local dev',
      accessRequestEmailRecipientsEmail: ['admin@example.com'], // Ensure recipients exist
      // Remove accessRequestEmailRecipientsRoles to avoid unmocked DB queries
    };
    const sentNotification = getSentNotification();
    sentNotification.createdAt = moment()
      .subtract(7, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    User.findOne.mockResolvedValue(user);
    InstanceSettings.findOne.mockResolvedValue(instanceSettings);
    SentNotification.findOne.mockResolvedValue(sentNotification);

    const res = await request(app)
      .post('/api/auth/requestAccess')
      .send({ id: user.id, comment: 'Please', roles: [], applications: [] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access request already sent');
    expect(User.findOne).toHaveBeenCalled();
    expect(InstanceSettings.findOne).toHaveBeenCalled();
    expect(SentNotification.findOne).toHaveBeenCalled();
    expect(NotificationQueue.create).not.toHaveBeenCalled();
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
        process.env.JWT_SECRET,
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

      RefreshToken.findOne.mockResolvedValue(refreshTokenRecord);
      RefreshToken.create.mockResolvedValue(true);
      User.findOne.mockResolvedValue({
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
      const expectedUser = { ...user };
      delete expectedUser.hash;
      expectedUser.passwordExpiresAt =
        expectedUser.passwordExpiresAt.toISOString();
      expect(res.body.data.user).toEqual(expectedUser);

      // Verify refresh token operations
      expect(RefreshToken.findOne).toHaveBeenCalledWith({
        where: { id: tokenId },
      });
      expect(RefreshToken.create).toHaveBeenCalled();
      expect(refreshTokenRecord.destroy).toHaveBeenCalled();

      // Verify new token is set in cookie
      expect(res.headers['set-cookie']).toBeDefined();
      expect(
        res.headers['set-cookie'].some(cookie => cookie.includes('token='))
      ).toBe(true);
    });

    it('should refresh token successfully with valid access token', async () => {
      const validToken = createValidToken(false);
      const refreshTokenRecord = createRefreshTokenRecord();

      RefreshToken.findOne.mockResolvedValue(refreshTokenRecord);
      RefreshToken.create.mockResolvedValue(true);
      User.findOne.mockResolvedValue({
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

      RefreshToken.findOne.mockResolvedValue(null); // No refresh token found

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

      RefreshToken.findOne.mockResolvedValue(expiredRefreshTokenRecord);

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

      RefreshToken.findOne.mockResolvedValue(refreshTokenRecord);
      User.findOne.mockResolvedValue(null); // User not found

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
        process.env.JWT_SECRET,
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
