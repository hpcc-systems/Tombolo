import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { blacklistTokenIntervalId } from '../../utils/tokenBlackListing.js';
import request from 'supertest';
import { app } from '../test_server.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { OrbitProfileMonitoring, sequelize } from '../../models/index.js';
import {
  getOrbitProfileMonitoring,
  AUTHED_USER_ID,
  getUuids,
} from '../helpers.js';
import { APPROVAL_STATUS } from '../../config/constants.js';

describe('orbitProfileMonitoring Routes', () => {
  beforeEach(() => {
    vi.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('POST / should create a new orbit profile monitoring', async () => {
    const orbitProfileMonitoring = getOrbitProfileMonitoring({}, true);
    OrbitProfileMonitoring.create.mockResolvedValue(orbitProfileMonitoring);
    OrbitProfileMonitoring.findByPk.mockResolvedValue(orbitProfileMonitoring);

    const res = await request(app)
      .post(`/api/orbitProfileMonitoring`)
      .send(orbitProfileMonitoring);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(orbitProfileMonitoring);
    expect(OrbitProfileMonitoring.create).toHaveBeenCalledTimes(1);
    expect(OrbitProfileMonitoring.create).toHaveBeenCalledWith({
      applicationId: orbitProfileMonitoring.applicationId,
      monitoringName: orbitProfileMonitoring.monitoringName,
      description: orbitProfileMonitoring.description,
      metaData: orbitProfileMonitoring.metaData,
      createdBy: AUTHED_USER_ID,
      lastUpdatedBy: AUTHED_USER_ID,
      approvalStatus: 'pending',
      isActive: false,
    });
  });

  it('GET /getAll/:applicationId should get all orbit profile monitorings for an application', async () => {
    const applicationId = uuidv4();
    const orbitProfileMonitorings = [
      getOrbitProfileMonitoring({ applicationId: applicationId }, true),
      getOrbitProfileMonitoring({ id: uuidv4() }, true),
      getOrbitProfileMonitoring({ id: uuidv4() }, true),
    ];
    OrbitProfileMonitoring.findAll.mockResolvedValue(orbitProfileMonitorings);
    const res = await request(app).get(
      `/api/orbitProfileMonitoring/getAll/${applicationId}`
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data[0]).toEqual(orbitProfileMonitorings[0]);
    expect(OrbitProfileMonitoring.findAll).toHaveBeenCalledTimes(1);
  });

  it('GET /getOne/:id should get orbit profile monitoring by ID', async () => {
    const orbitProfileMonitoring = getOrbitProfileMonitoring({}, true);
    OrbitProfileMonitoring.findOne.mockResolvedValue(orbitProfileMonitoring);

    const res = await request(app).get(
      `/api/orbitProfileMonitoring/getOne/${orbitProfileMonitoring.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(orbitProfileMonitoring);
    expect(OrbitProfileMonitoring.findOne).toHaveBeenCalledTimes(1);
  });

  it('GET /getOne/:id should 404 if invalid monitoring id', async () => {
    const orbitProfileMonitoring = getOrbitProfileMonitoring({}, true);
    OrbitProfileMonitoring.findOne.mockResolvedValue(null);

    const res = await request(app).get(
      `/api/orbitProfileMonitoring/getOne/${orbitProfileMonitoring.id}`
    );
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toEqual('Orbit profile monitoring not found');
    expect(OrbitProfileMonitoring.findOne).toHaveBeenCalledTimes(1);
  });

  it('PUT /:id should update orbit profile monitoring successfully', async () => {
    const orbitProfileMonitoring = getOrbitProfileMonitoring({}, true);
    const updateData = {
      applicationId: orbitProfileMonitoring.applicationId,
      monitoringName: 'Updated Monitoring Name',
      description: 'Updated description',
      metaData: {
        domain: 'updated-domain.com',
        productCategory: 'Updated Category',
        severity: 'Medium',
        conditions: {
          buildThreshold: 95,
          monitoringFrequency: 'hourly',
          alertOnFailure: false,
        },
      },
    };

    const updatedMonitoring = {
      ...orbitProfileMonitoring,
      ...updateData,
      lastUpdatedBy: AUTHED_USER_ID,
      approvalStatus: 'pending',
    };

    // Mock the findOne to return the existing monitoring
    OrbitProfileMonitoring.findOne.mockResolvedValue(orbitProfileMonitoring);

    // Mock the update method on the instance
    orbitProfileMonitoring.update = jest
      .fn()
      .mockResolvedValue(updatedMonitoring);

    // Mock findByPk to return the updated monitoring
    OrbitProfileMonitoring.findByPk.mockResolvedValue(updatedMonitoring);

    const res = await request(app)
      .put(`/api/orbitProfileMonitoring/${orbitProfileMonitoring.id}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      'Orbit profile monitoring updated successfully'
    );
    expect(res.body.data).toMatchObject({
      ...updatedMonitoring,
      lastUpdatedBy: AUTHED_USER_ID,
      approvalStatus: 'pending',
    });
    expect(OrbitProfileMonitoring.findOne).toHaveBeenCalledWith({
      where: { id: orbitProfileMonitoring.id },
    });
    const expectedUpdateData = { ...updateData };
    delete expectedUpdateData.applicationId; // Controller removes applicationId
    expect(orbitProfileMonitoring.update).toHaveBeenCalledWith({
      ...expectedUpdateData,
      lastUpdatedBy: AUTHED_USER_ID,
      approvalStatus: 'pending',
      isActive: false,
    });
  });

  it('PUT /:id should return 404 when orbit profile monitoring not found', async () => {
    const nonExistentId = uuidv4();
    const updateData = {
      applicationId: uuidv4(),
      monitoringName: 'Updated Name',
      description: 'Updated description',
      metaData: {
        domain: 'test-domain.com',
        productCategory: 'Test Category',
      },
    };

    OrbitProfileMonitoring.findOne.mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/orbitProfileMonitoring/${nonExistentId}`)
      .send(updateData);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Orbit profile monitoring not found');
    expect(OrbitProfileMonitoring.findOne).toHaveBeenCalledWith({
      where: { id: nonExistentId },
    });
  });

  it('DELETE / should delete orbit profile monitorings successfully', async () => {
    const uuids = getUuids(3);
    const reqBody = {
      ids: uuids,
    };

    // Mock transaction - for callback pattern sequelize.transaction(async t => {...})
    const mockTransaction = { commit: vi.fn(), rollback: vi.fn() };
    jest.spyOn(sequelize, 'transaction').mockImplementation(async callback => {
      return await callback(mockTransaction);
    });

    OrbitProfileMonitoring.update.mockResolvedValue([3]); // Mock successful update of 3 records

    const res = await request(app)
      .delete('/api/orbitProfileMonitoring/')
      .send(reqBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      'Orbit profile monitoring deleted successfully'
    );
    expect(res.body.data).toEqual(uuids);
    expect(sequelize.transaction).toHaveBeenCalled();
    expect(OrbitProfileMonitoring.update).toHaveBeenCalledWith(
      {
        deletedBy: AUTHED_USER_ID,
        deletedAt: expect.any(Date),
      },
      {
        where: { id: { [Op.in]: uuids } },
        transaction: mockTransaction,
      }
    );
  });

  it('PATCH /toggleStatus should toggle orbit profile monitoring status successfully', async () => {
    const uuids = getUuids(2);
    const reqBody = {
      ids: uuids,
      isActive: true,
    };

    const orbitMonitoringOne = getOrbitProfileMonitoring(
      {
        id: uuids[0],
        isActive: false,
        approvalStatus: APPROVAL_STATUS.APPROVED,
      },
      true
    );

    const orbitMonitoringTwo = getOrbitProfileMonitoring(
      {
        id: uuids[1],
        isActive: false,
        approvalStatus: APPROVAL_STATUS.APPROVED,
      },
      true
    );

    const updatedMonitoringOne = {
      ...orbitMonitoringOne,
      isActive: true,
      lastUpdatedBy: AUTHED_USER_ID,
    };
    const updatedMonitoringTwo = {
      ...orbitMonitoringTwo,
      isActive: true,
      lastUpdatedBy: AUTHED_USER_ID,
    };

    // Mock first findAll call (checking for approved monitorings)
    OrbitProfileMonitoring.findAll
      .mockResolvedValueOnce([orbitMonitoringOne, orbitMonitoringTwo])
      .mockResolvedValueOnce([updatedMonitoringOne, updatedMonitoringTwo]);

    OrbitProfileMonitoring.update.mockResolvedValue([2]);

    const res = await request(app)
      .patch('/api/orbitProfileMonitoring/toggleStatus')
      .send(reqBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Monitoring status updated successfully');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject(updatedMonitoringOne);
    expect(res.body.data[1]).toMatchObject(updatedMonitoringTwo);

    expect(OrbitProfileMonitoring.findAll).toHaveBeenCalledTimes(2);
    expect(OrbitProfileMonitoring.findAll).toHaveBeenNthCalledWith(1, {
      where: {
        id: { [Op.in]: uuids },
        approvalStatus: APPROVAL_STATUS.APPROVED,
      },
    });

    expect(OrbitProfileMonitoring.update).toHaveBeenCalledWith(
      {
        isActive: true,
        lastUpdatedBy: AUTHED_USER_ID,
      },
      {
        where: {
          id: { [Op.in]: uuids },
          approvalStatus: APPROVAL_STATUS.APPROVED,
        },
      }
    );
  });

  it('PATCH /toggleStatus should return 404 when no eligible orbit profile monitorings found', async () => {
    const uuids = getUuids(2);
    const reqBody = {
      ids: uuids,
      isActive: true,
    };

    OrbitProfileMonitoring.findAll.mockResolvedValue([]);

    const res = await request(app)
      .patch('/api/orbitProfileMonitoring/toggleStatus')
      .send(reqBody);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      'No eligible orbit profile monitorings found'
    );

    expect(OrbitProfileMonitoring.findAll).toHaveBeenCalledWith({
      where: {
        id: { [Op.in]: uuids },
        approvalStatus: APPROVAL_STATUS.APPROVED,
      },
    });

    expect(OrbitProfileMonitoring.update).not.toHaveBeenCalled();
  });

  it('PATCH /evaluate should evaluate orbit profile monitoring successfully', async () => {
    const uuids = getUuids(2);
    const reqBody = {
      ids: uuids,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approverComment: 'Monitoring looks good to go',
      isActive: true,
    };

    const orbitMonitoringOne = getOrbitProfileMonitoring(
      {
        id: uuids[0],
        approvalStatus: APPROVAL_STATUS.PENDING,
      },
      true
    );

    const orbitMonitoringTwo = getOrbitProfileMonitoring(
      {
        id: uuids[1],
        approvalStatus: APPROVAL_STATUS.PENDING,
      },
      true
    );

    const mockApprovedAt = new Date();

    const evaluatedMonitoringOne = {
      ...orbitMonitoringOne,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approverComment: 'Monitoring looks good to go',
      isActive: true,
      approvedBy: AUTHED_USER_ID,
      approvedAt: mockApprovedAt,
      lastUpdatedBy: AUTHED_USER_ID,
    };

    const evaluatedMonitoringTwo = {
      ...orbitMonitoringTwo,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approverComment: 'Monitoring looks good to go',
      isActive: true,
      approvedBy: AUTHED_USER_ID,
      approvedAt: mockApprovedAt,
      lastUpdatedBy: AUTHED_USER_ID,
    };

    OrbitProfileMonitoring.update.mockResolvedValue([2]);
    OrbitProfileMonitoring.findAll.mockResolvedValue([
      evaluatedMonitoringOne,
      evaluatedMonitoringTwo,
    ]);

    const res = await request(app)
      .patch('/api/orbitProfileMonitoring/evaluate')
      .send(reqBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      'Orbit profile monitoring approved successfully'
    );
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      id: orbitMonitoringOne.id,
      applicationId: orbitMonitoringOne.applicationId,
      monitoringName: orbitMonitoringOne.monitoringName,
      description: orbitMonitoringOne.description,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approverComment: 'Monitoring looks good to go',
      isActive: true,
      approvedBy: AUTHED_USER_ID,
      lastUpdatedBy: AUTHED_USER_ID,
    });
    expect(res.body.data[0].approvedAt).toBeTruthy();
    expect(res.body.data[1]).toMatchObject({
      id: orbitMonitoringTwo.id,
      applicationId: orbitMonitoringTwo.applicationId,
      monitoringName: orbitMonitoringTwo.monitoringName,
      description: orbitMonitoringTwo.description,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approverComment: 'Monitoring looks good to go',
      isActive: true,
      approvedBy: AUTHED_USER_ID,
      lastUpdatedBy: AUTHED_USER_ID,
    });
    expect(res.body.data[1].approvedAt).toBeTruthy();

    expect(OrbitProfileMonitoring.update).toHaveBeenCalledWith(
      {
        approverComment: 'Monitoring looks good to go',
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: true,
        approvedBy: AUTHED_USER_ID,
        approvedAt: expect.any(Date),
        lastUpdatedBy: AUTHED_USER_ID,
      },
      {
        where: { id: { [Op.in]: uuids } },
      }
    );

    expect(OrbitProfileMonitoring.findAll).toHaveBeenCalledWith({
      where: { id: { [Op.in]: uuids } },
      include: expect.any(Array),
    });
  });
});
