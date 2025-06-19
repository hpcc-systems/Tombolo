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

  // // TODO: Bulk update call throws error on middlware UUID check
  // it('bulk-update should update user info', async () => {
  //   const users = getUsers();
  //   const user1Mock = {
  //     ...users[0],
  //     save: jest.fn().mockResolvedValue({ ...users[0], firstName: 'Johnny' }),
  //   };
  //   const user2Mock = {
  //     ...users[1],
  //     save: jest.fn().mockResolvedValue({ ...users[1], firstName: 'Janet' }),
  //   };
  //   User.findOne
  //     .mockResolvedValueOnce(user1Mock)
  //     .mockResolvedValueOnce(user2Mock);

  //   const res = await request(app)
  //     .patch(`/api/users/bulk-update`)
  //     .send({
  //       users: [
  //         { firstName: 'Johnny', ...users[0] },
  //         { firstName: 'Janet', ...users[1] },
  //       ],
  //     });

  //   console.warn(res.body);
  //   expect(res.status).toBe(200);
  //   expect(res.body.success).toBe(true);
  //   expect(res.body.data[0].firstName).toBe('Johnny');
  //   expect(res.body.data[1].firstName).toBe('Janet');
  //   expect(User.findOne).toHaveBeenCalledTimes(2);
  //   expect(User.save).toHaveBeenCalledTimes(2);
  //   expect(user1Mock.save).toHaveBeenCalled();
  //   expect(user2Mock.save).toHaveBeenCalled();
  // });

  // // TODO: Bulk update call throws error on middlware UUID check
  // it('bulk-update should return 207 if a user to update not found', async () => {
  //   User.findOne.mockResolvedValue(null);

  //   const res = await request(app)
  //     .patch(`/api/users/bulk-update`)
  //     .send({ users: [{ id: nonExistentID, firstName: 'Johnny' }] });

  //   expect(res.status).toBe(207);
  //   expect(res.body.success).toBe(false);
  //   expect(res.errors.length).toBe(1);
  //   const failedObject = res.errors[0];
  //   expect(failedObject.status).toBe(404);
  //   expect(failedObject.id).toEqual(nonExistentID);
  //   expect(User.findOne).toHaveBeenCalled();
  //   expect(User.save).not.toHaveBeenCalled();
  // });

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

  // TODO: middleware/userMiddleware.js/validateBulkUpdatePayload:166
  // Throwing error on uuid parsing, not sure if this is intentional

  // it('should bulk update users', async () => {
  //   User.findOne.mockReturnValueOnce(users[0]).mockReturnValueOnce(users[1]);

  //   const updates = users.map(user => {
  //     return {
  //       id: user.id,
  //       firstName: `Updated${user.firstName}`,
  //     };
  //   });

  //   console.warn({ users: updates });

  //   const res = await request(app)
  //     .patch('/api/users/bulk-update')
  //     .send({ users: updates });

  //   expect(res.status).toBe(200);
  //   expect(res.body.success).toBe(true);
  //   expect(res.body.message).toBe('Users updated successfully');
  //   expect(User.findOne).toHaveBeenCalledTimes(2);
  //   expect(User.save).toHaveBeenCalledTimes(2);
  //   expect(User.findOne).toHaveBeenCalledWith({ where: { id: users[0].id } });
  //   expect(User.findOne).toHaveBeenCalledWith({ where: { id: users[1].id } });
  // });

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
