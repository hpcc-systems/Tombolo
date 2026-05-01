import { vi, describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../test_server.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { mockedModels } from '../mockedModels.js';
const { OrbitProfileMonitoring, sequelize } = mockedModels;
import {
  getOrbitProfileMonitoring,
  AUTHED_USER_ID,
  getUuids,
} from '../helpers.js';
import { APPROVAL_STATUS } from '../../config/constants.js';
import {
  defineApiCase,
  defineMutationCase,
  useMonitoringApiRouteLifecycle,
} from './monitoringCrudContract.js';

describe('orbitProfileMonitoring Routes', () => {
  useMonitoringApiRouteLifecycle();

  defineApiCase({
    title: 'POST / should create a new orbit profile monitoring',
    method: 'post',
    path: () => '/api/orbitProfileMonitoring',
    buildEntity: () => getOrbitProfileMonitoring({}, true),
    expectedStatus: 201,
    assertSuccess: true,
    arrange: orbitProfileMonitoring => {
      OrbitProfileMonitoring.create.mockResolvedValue(orbitProfileMonitoring);
      OrbitProfileMonitoring.findByPk.mockResolvedValue(orbitProfileMonitoring);
    },
    assert: (res, orbitProfileMonitoring) => {
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
    },
  });

  defineApiCase({
    title:
      'GET /getAll/:applicationId should get all orbit profile monitorings for an application',
    method: 'get',
    path: orbitProfileMonitoring =>
      `/api/orbitProfileMonitoring/getAll/${orbitProfileMonitoring.applicationId}`,
    buildEntity: () =>
      getOrbitProfileMonitoring({ applicationId: uuidv4() }, true),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: orbitProfileMonitoring => {
      const orbitProfileMonitorings = [
        orbitProfileMonitoring,
        getOrbitProfileMonitoring({ id: uuidv4() }, true),
        getOrbitProfileMonitoring({ id: uuidv4() }, true),
      ];
      OrbitProfileMonitoring.findAll.mockResolvedValue(orbitProfileMonitorings);
    },
    assert: (res, orbitProfileMonitoring) => {
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0]).toEqual(orbitProfileMonitoring);
      expect(OrbitProfileMonitoring.findAll).toHaveBeenCalledTimes(1);
    },
  });

  defineApiCase({
    title: 'GET /getOne/:id should get orbit profile monitoring by ID',
    method: 'get',
    path: orbitProfileMonitoring =>
      `/api/orbitProfileMonitoring/getOne/${orbitProfileMonitoring.id}`,
    buildEntity: () => getOrbitProfileMonitoring({}, true),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: orbitProfileMonitoring => {
      OrbitProfileMonitoring.findOne.mockResolvedValue(orbitProfileMonitoring);
    },
    assert: (res, orbitProfileMonitoring) => {
      expect(res.body.data).toEqual(orbitProfileMonitoring);
      expect(OrbitProfileMonitoring.findOne).toHaveBeenCalledTimes(1);
    },
  });

  defineApiCase({
    title: 'GET /getOne/:id should 404 if invalid monitoring id',
    method: 'get',
    path: orbitProfileMonitoring =>
      `/api/orbitProfileMonitoring/getOne/${orbitProfileMonitoring.id}`,
    buildEntity: () => getOrbitProfileMonitoring({}, true),
    expectedStatus: 404,
    assertSuccess: false,
    arrange: () => {
      OrbitProfileMonitoring.findOne.mockResolvedValue(null);
    },
    assert: res => {
      expect(res.body.message).toEqual('Orbit profile monitoring not found');
      expect(OrbitProfileMonitoring.findOne).toHaveBeenCalledTimes(1);
    },
  });

  it('PUT /:id should update orbit profile monitoring successfully', async () => {
    const orbitProfileMonitoring = {
      ...getOrbitProfileMonitoring({}, true),
      update: vi.fn(),
    };
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
    orbitProfileMonitoring.update.mockResolvedValue(updatedMonitoring);

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
    const { update: _update, ...expectedData } = updatedMonitoring;
    expect(res.body.data).toMatchObject({
      ...expectedData,
      lastUpdatedBy: AUTHED_USER_ID,
      approvalStatus: 'pending',
    });
    expect(OrbitProfileMonitoring.findOne).toHaveBeenCalledWith({
      where: { id: orbitProfileMonitoring.id },
    });
    const { applicationId: _applicationId, ...expectedUpdateData } = updateData;
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

  defineMutationCase({
    title: 'DELETE / should delete orbit profile monitorings successfully',
    method: 'delete',
    path: '/api/orbitProfileMonitoring/',
    buildBody: () => ({ ids: getUuids(3) }),
    expectedStatus: 200,
    assertSuccess: true,
    expectedMessage: 'Orbit profile monitoring deleted successfully',
    arrange: () => {
      const mockTransaction = { commit: vi.fn(), rollback: vi.fn() };
      vi.spyOn(sequelize, 'transaction').mockImplementation(async callback => {
        return await callback(mockTransaction);
      });

      OrbitProfileMonitoring.update.mockResolvedValue([3]);
    },
    assert: (res, reqBody) => {
      expect(res.body.data).toEqual(reqBody.ids);
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(OrbitProfileMonitoring.update).toHaveBeenCalledWith(
        {
          deletedBy: AUTHED_USER_ID,
          deletedAt: expect.any(Date),
        },
        {
          where: { id: { [Op.in]: reqBody.ids } },
          transaction: expect.any(Object),
        }
      );
    },
  });

  defineMutationCase({
    title:
      'PATCH /toggleStatus should toggle orbit profile monitoring status successfully',
    method: 'patch',
    path: '/api/orbitProfileMonitoring/toggleStatus',
    buildBody: () => ({
      ids: getUuids(2),
      isActive: true,
    }),
    expectedStatus: 200,
    assertSuccess: true,
    expectedMessage: 'Monitoring status updated successfully',
    arrange: reqBody => {
      const orbitMonitoringOne = getOrbitProfileMonitoring(
        {
          id: reqBody.ids[0],
          isActive: false,
          approvalStatus: APPROVAL_STATUS.APPROVED,
        },
        true
      );

      const orbitMonitoringTwo = getOrbitProfileMonitoring(
        {
          id: reqBody.ids[1],
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

      OrbitProfileMonitoring.findAll
        .mockResolvedValueOnce([orbitMonitoringOne, orbitMonitoringTwo])
        .mockResolvedValueOnce([updatedMonitoringOne, updatedMonitoringTwo]);

      OrbitProfileMonitoring.update.mockResolvedValue([2]);
    },
    assert: (res, reqBody) => {
      expect(res.body.data).toHaveLength(2);

      expect(OrbitProfileMonitoring.findAll).toHaveBeenCalledTimes(2);
      expect(OrbitProfileMonitoring.findAll).toHaveBeenNthCalledWith(1, {
        where: {
          id: { [Op.in]: reqBody.ids },
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
            id: { [Op.in]: reqBody.ids },
            approvalStatus: APPROVAL_STATUS.APPROVED,
          },
        }
      );
    },
  });

  defineMutationCase({
    title:
      'PATCH /toggleStatus should return 404 when no eligible orbit profile monitorings found',
    method: 'patch',
    path: '/api/orbitProfileMonitoring/toggleStatus',
    buildBody: () => ({
      ids: getUuids(2),
      isActive: true,
    }),
    expectedStatus: 404,
    assertSuccess: false,
    expectedMessage: 'No eligible orbit profile monitorings found',
    arrange: () => {
      OrbitProfileMonitoring.findAll.mockResolvedValue([]);
    },
    assert: (_res, reqBody) => {
      expect(OrbitProfileMonitoring.findAll).toHaveBeenCalledWith({
        where: {
          id: { [Op.in]: reqBody.ids },
          approvalStatus: APPROVAL_STATUS.APPROVED,
        },
      });

      expect(OrbitProfileMonitoring.update).not.toHaveBeenCalled();
    },
  });

  defineMutationCase({
    title:
      'PATCH /evaluate should evaluate orbit profile monitoring successfully',
    method: 'patch',
    path: '/api/orbitProfileMonitoring/evaluate',
    buildBody: () => ({
      ids: getUuids(2),
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approverComment: 'Monitoring looks good to go',
      isActive: true,
    }),
    expectedStatus: 200,
    assertSuccess: true,
    expectedMessage: 'Orbit profile monitoring approved successfully',
    arrange: reqBody => {
      const evaluatedMonitoringOne = getOrbitProfileMonitoring(
        {
          id: reqBody.ids[0],
          approvalStatus: APPROVAL_STATUS.APPROVED,
          approverComment: 'Monitoring looks good to go',
          isActive: true,
          approvedBy: AUTHED_USER_ID,
          approvedAt: new Date(),
          lastUpdatedBy: AUTHED_USER_ID,
        },
        true
      );

      const evaluatedMonitoringTwo = getOrbitProfileMonitoring(
        {
          id: reqBody.ids[1],
          approvalStatus: APPROVAL_STATUS.APPROVED,
          approverComment: 'Monitoring looks good to go',
          isActive: true,
          approvedBy: AUTHED_USER_ID,
          approvedAt: new Date(),
          lastUpdatedBy: AUTHED_USER_ID,
        },
        true
      );

      OrbitProfileMonitoring.update.mockResolvedValue([2]);
      OrbitProfileMonitoring.findAll.mockResolvedValue([
        evaluatedMonitoringOne,
        evaluatedMonitoringTwo,
      ]);
    },
    assert: (res, reqBody) => {
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].approvedAt).toBeTruthy();
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
          where: { id: { [Op.in]: reqBody.ids } },
        }
      );

      expect(OrbitProfileMonitoring.findAll).toHaveBeenCalledWith({
        where: { id: { [Op.in]: reqBody.ids } },
        include: expect.any(Array),
      });
    },
  });
});
