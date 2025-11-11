const request = require('supertest');
const { app } = require('../test_server');
const {
  SentNotification,
  User,
  InstanceSetting,
  NotificationQueue,
  RefreshToken,
} = require('../../models');
const { blacklistTokenIntervalId } = require('../../utils/tokenBlackListing');
const {
  getUsers,
  getInstanceSettings,
  getSentNotification,
  getLoginPayload,
  nonExistentID,
} = require('../helpers');
const moment = require('moment');
const logger = require('../../config/logger');

const getUser = () => getUsers()[0];

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  // Test end to end basic user registration
  // it('Should register a new user on /api/auth/registerBasicUser', async () => {
  //   const response = await request(app)
  //     .post('/api/auth/registerBasicUser')
  //     .send(payload);

  //   // Check the response
  //   expect(response.status).toBe(201);
  //   expect(response.body.success).toBe(true);
  //   expect(response.body.message).toBe('User created successfully');
  // });

  it('basic-login Should log in a user', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);

    User.findOne.mockResolvedValue({
      ...user,
      toJSON: () => JSON.stringify(user, null, 4),
    });
    RefreshToken.create.mockResolvedValue(true);
    User.update.mockResolvedValue([1]);

    const res = await request(app)
      .post('/api/auth/loginBasicUser')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('User logged in successfully');
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
      'Username and Password combination not found'
    );
    expect(res.body.success).toBe(false);
    expect(User.findOne).toHaveBeenCalled();
    expect(RefreshToken.create).not.toHaveBeenCalled();
    expect(User.update).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
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
    expect(logger.error).toHaveBeenCalled();
  });

  it('basic-login should 401 if user is registered with azure', async () => {
    const user = getUser();
    const payload = getLoginPayload(user);
    user.registrationMethod = 'azure';

    User.findOne.mockResolvedValue(user);

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
    expect(logger.error).toHaveBeenCalled();
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
      'Username and Password combination not found'
    );
    expect(res.body.success).toBe(false);
    expect(User.findOne).toHaveBeenCalled();
    expect(RefreshToken.create).not.toHaveBeenCalled();
    expect(User.update).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('request-access should request access', async () => {
    const user = getUser();
    const instanceSettings = getInstanceSettings();
    User.findOne.mockResolvedValue(user);
    InstanceSetting.findOne.mockResolvedValue(instanceSettings);
    SentNotification.findOne.mockResolvedValue(null);
    NotificationQueue.create.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/requestAccess')
      .send({ id: user.id, comment: 'Please', roles: [], applications: [] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access requested successfully');
    expect(User.findOne).toHaveBeenCalled();
    expect(InstanceSetting.findOne).toHaveBeenCalled();
    expect(SentNotification.findOne).toHaveBeenCalled();
    expect(NotificationQueue.create).toHaveBeenCalled();
  });

  it('request-access should request access if existingNotification >24 hours', async () => {
    const user = getUser();
    const instanceSettings = getInstanceSettings();
    const sentNotification = getSentNotification();
    sentNotification.createdAt = moment()
      .subtract(25, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    User.findOne.mockResolvedValue(user);
    InstanceSetting.findOne.mockResolvedValue(instanceSettings);
    SentNotification.findOne.mockResolvedValue(sentNotification);
    NotificationQueue.create.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/requestAccess')
      .send({ id: user.id, comment: 'Please', roles: [], applications: [] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access requested successfully');
    expect(User.findOne).toHaveBeenCalled();
    expect(InstanceSetting.findOne).toHaveBeenCalled();
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
    expect(InstanceSetting.findOne).not.toHaveBeenCalled();
    expect(SentNotification.findOne).not.toHaveBeenCalled();
  });

  it('request-access should not send another request in <24 hours', async () => {
    const user = getUser();
    const instanceSettings = getInstanceSettings();
    const sentNotification = getSentNotification();
    sentNotification.createdAt = moment()
      .subtract(7, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    User.findOne.mockResolvedValue(user);
    InstanceSetting.findOne.mockResolvedValue(instanceSettings);
    SentNotification.findOne.mockResolvedValue(sentNotification);

    const res = await request(app)
      .post('/api/auth/requestAccess')
      .send({ id: user.id, comment: 'Please', roles: [], applications: [] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access request already sent');
    expect(User.findOne).toHaveBeenCalled();
    expect(InstanceSetting.findOne).toHaveBeenCalled();
    expect(SentNotification.findOne).toHaveBeenCalled();
    expect(NotificationQueue.create).not.toHaveBeenCalled();
  });
});
