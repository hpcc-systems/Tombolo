const request = require('supertest');
const { app } = require('../test_server');
const {
  user: User,
  userArchive: UserArchive,
  notification_queue: NotificationQueue,
  sequelize,
} = require('../../models');
const { blacklistTokenIntervalId } = require('../../utils/tokenBlackListing');
const logger = require('../../config/logger');
const { getUsers, nonExistentID } = require('../helpers');

beforeAll(async () => {});

describe('User Routes', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
    // Used for mocking express validator, not functioning
    // jest.mock('express-validator', () => ({
    //   body: jest.fn().mockReturnValue({
    //     isUUID: jest.fn().mockReturnThis(),
    //     isArray: jest.fn().mockReturnThis(),
    //     withMessage: jest.fn().mockReturnThis(),
    //   }),
    //   validationResult: jest.fn().mockReturnValue({
    //     isEmpty: jest.fn().mockReturnValue(true),
    //     array: jest.fn().mockReturnValue([]),
    //   }),
    // }));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
    // jest.resetAllMocks();
    // jest.restoreAllMocks();
    // jest.resetModules();
  });

  it('get-users should get all users', async () => {
    const users = getUsers();
    User.findAll.mockResolvedValue(users);

    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Users retrieved successfully');
    expect(res.body.data).toEqual(users);
    expect(User.findAll).toHaveBeenCalled();
  });

  it('get-user should get a user by ID', async () => {
    const users = getUsers();
    const user = users[0];
    User.findOne.mockResolvedValue(user);

    const res = await request(app).get(`/api/users/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(user);
    expect(User.findOne).toHaveBeenCalled();
  });

  it('get-user should return 404 if user not found', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).get(`/api/users/${nonExistentID}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('User not found');
    expect(User.findOne).toHaveBeenCalledWith({ where: { id: nonExistentID } });
    expect(logger.error).toHaveBeenCalled();
  });

  it('update-user should update a users info', async () => {
    const users = getUsers();
    const user = users[0];
    const reqBody = {
      firstName: 'Johnny',
      ...user,
    };

    User.findOne.mockResolvedValue({
      ...user,
      save: jest.fn().mockResolvedValue(reqBody),
    });

    const res = await request(app).patch(`/api/users/${user.id}`).send(reqBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('User updated successfully');
    expect(res.body.data).toEqual(reqBody);
    expect(User.findOne).toHaveBeenCalled();
    expect(sequelize.transaction).toHaveBeenCalled();
    expect(sequelize.__commit).toHaveBeenCalled();
    expect(sequelize.__rollback).not.toHaveBeenCalled();
    expect(NotificationQueue.create).toHaveBeenCalled();
  });

  it('update-user should return 404 if user id is invalid', async () => {
    const users = getUsers();
    const user = users[0];
    User.findOne.mockResolvedValue(null);
    const reqBody = {
      firstName: 'Johnny',
      ...user,
    };

    const res = await request(app)
      .patch(`/api/users/${nonExistentID}`)
      .send(reqBody);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('User not found');
    expect(User.findOne).toHaveBeenCalled();
    expect(sequelize.transaction).toHaveBeenCalled();
    expect(sequelize.__commit).not.toHaveBeenCalled();
    expect(sequelize.__rollback).toHaveBeenCalled();
    expect(NotificationQueue.create).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('delete-user should delete a user by ID', async () => {
    const users = getUsers();
    const user = users[0];
    User.findByPk.mockResolvedValue({ dataValues: user });
    UserArchive.create.mockResolvedValue(true);
    User.destroy.mockResolvedValue(true);

    const res = await request(app).delete(`/api/users/${user.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('User deleted successfully');
    expect(User.destroy).toHaveBeenCalled();
    expect(UserArchive.create).toHaveBeenCalled();
  });

  it('delete-user should return 404 if user not found', async () => {
    User.findByPk.mockResolvedValue(null);

    const res = await request(app).delete(`/api/users/${nonExistentID}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(User.destroy).not.toHaveBeenCalled();
    expect(UserArchive.create).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('change-password should change user password', async () => {
    const users = getUsers();
    const user = users[0];
    User.findOne.mockResolvedValue(user);

    const res = await request(app)
      .patch(`/api/users/change-password/${user.id}`)
      .send({
        currentPassword: 'Password123!',
        newPassword: 'NewPassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(User.findOne).toHaveBeenCalled();
    expect(User.update).toHaveBeenCalled();
    expect(NotificationQueue.create).toHaveBeenCalled();
    expect(sequelize.transaction).toHaveBeenCalled();
    expect(sequelize.__commit).toHaveBeenCalled();
    expect(sequelize.__rollback).not.toHaveBeenCalled();
  });

  it('change-password should return 400 if currentPassword is incorrect', async () => {
    const users = getUsers();
    const user = users[0];
    User.findOne.mockResolvedValue(user);

    const res = await request(app)
      .patch(`/api/users/change-password/${user.id}`)
      .send({
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(User.findOne).toHaveBeenCalled();
    expect(User.update).not.toHaveBeenCalled();
    expect(NotificationQueue.create).not.toHaveBeenCalled();
    expect(sequelize.transaction).toHaveBeenCalled();
    expect(sequelize.__commit).not.toHaveBeenCalled();
    expect(sequelize.__rollback).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('change-password should return 404 if user does not exist', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/users/change-password/${nonExistentID}`)
      .send({
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123!',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(User.findOne).toHaveBeenCalled();
    expect(User.update).not.toHaveBeenCalled();
    expect(NotificationQueue.create).not.toHaveBeenCalled();
    expect(sequelize.transaction).toHaveBeenCalled();
    expect(sequelize.__commit).not.toHaveBeenCalled();
    expect(sequelize.__rollback).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('reset-password-for-user should return 200 for generating password reset link', async () => {
    // TODO: Create this test
  });

  it('reset-password-for-user should return 404 if user not found for password reset', async () => {
    // TODO: Create this test
  });

  it('bulk-delete should bulk delete users', async () => {
    const users = getUsers();
    User.findByPk
      .mockReturnValueOnce({ dataValues: users[0] })
      .mockReturnValueOnce({ dataValues: users[1] });
    UserArchive.create
      .mockResolvedValueOnce({
        ...users[0],
        removedAt: new Date(),
        removedBy: 'Admin Removal',
      })
      .mockResolvedValueOnce({
        ...users[1],
        removedAt: new Date(),
        removedBy: 'Admin Removal',
      });

    const ids = users.map(user => user.id);
    const res = await request(app)
      .delete('/api/users/bulk-delete')
      .send({ ids });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Users deleted successfully');
    expect(User.findByPk).toHaveBeenCalledTimes(2);
    expect(UserArchive.create).toHaveBeenCalledTimes(2);
    expect(User.destroy).toHaveBeenCalledTimes(2);
  });

  it('bulk-delete should fail to delete some users if some invalid users', async () => {
    const users = getUsers();
    User.findByPk
      .mockReturnValueOnce({ dataValues: users[0] })
      .mockReturnValueOnce(null);
    UserArchive.create.mockResolvedValueOnce({
      ...users[0],
      removedAt: new Date(),
      removedBy: 'Admin Removal',
    });
    User.destroy.mockResolvedValue(true);

    const ids = [users[0].id, nonExistentID];
    const res = await request(app)
      .delete('/api/users/bulk-delete')
      .send({ ids });

    expect(res.status).toBe(207);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Some users could not be deleted');
    expect(res.body.data.deletedCount).toBe(1);
    expect(res.body.data.idsCount).toBe(2);
    expect(User.findByPk).toHaveBeenCalledTimes(2);
    expect(UserArchive.create).toHaveBeenCalledTimes(1);
    expect(User.destroy).toHaveBeenCalledTimes(1);
  });
});
