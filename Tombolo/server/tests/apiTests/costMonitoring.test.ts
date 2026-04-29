import { describe, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { mockedModels } from '../mockedModels.js';
const { CostMonitoring } = mockedModels;
import { getUuids, getCostMonitoring, AUTHED_USER_ID } from '../helpers.js';
import { Op } from 'sequelize';
import { APPROVAL_STATUS } from '../../config/constants.js';
import {
  defineApiCase,
  defineMutationCase,
  useMonitoringApiRouteLifecycle,
} from './monitoringCrudContract.js';

describe('costMonitoring Routes', () => {
  useMonitoringApiRouteLifecycle();

  defineMutationCase({
    title: 'PATCH /evaluate should evaluate one monitoring',
    method: 'patch',
    path: '/api/costMonitoring/evaluate',
    buildBody: () => {
      const uuid = uuidv4();
      return {
        ids: [uuid],
        isActive: true,
        approvalStatus: APPROVAL_STATUS.APPROVED,
        approverComment: 'Test Approval Comment',
      };
    },
    expectedStatus: 200,
    assertSuccess: true,
    expectedMessage: 'Cost monitoring(s) evaluated successfully',
    assert: (_res, reqBody) => {
      expect(CostMonitoring.update).toHaveBeenCalledWith(
        {
          approvalStatus: APPROVAL_STATUS.APPROVED,
          isActive: true,
          approvedBy: AUTHED_USER_ID,
          approvedAt: expect.any(Date),
          approverComment: 'Test Approval Comment',
        },
        {
          where: {
            id: { [Op.in]: reqBody.ids },
          },
        }
      );
    },
  });

  defineMutationCase({
    title: 'PATCH /evaluate should evaluate multiple monitorings',
    method: 'patch',
    path: '/api/costMonitoring/evaluate',
    buildBody: () => ({
      ids: getUuids(4),
      isActive: true,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approverComment: 'Test Approval Comment',
    }),
    expectedStatus: 200,
    assertSuccess: true,
    expectedMessage: 'Cost monitoring(s) evaluated successfully',
    assert: (_res, reqBody) => {
      expect(CostMonitoring.update).toHaveBeenCalledWith(
        {
          approvalStatus: APPROVAL_STATUS.APPROVED,
          isActive: true,
          approvedBy: AUTHED_USER_ID,
          approvedAt: expect.any(Date),
          approverComment: 'Test Approval Comment',
        },
        {
          where: {
            id: { [Op.in]: reqBody.ids },
          },
        }
      );
    },
  });

  defineMutationCase({
    title: 'PUT /toggle should toggle active status',
    method: 'put',
    path: '/api/costMonitoring/toggle',
    buildBody: () => {
      const uuids = getUuids(2);
      const action = 'start';
      return {
        ids: uuids,
        action,
      };
    },
    expectedStatus: 200,
    assertSuccess: true,
    expectedMessage: 'Cost monitoring(s) toggled successfully',
    arrange: reqBody => {
      const costMonitoringOne = getCostMonitoring({
        id: reqBody.ids[0],
        isActive: false,
      });
      const costMonitoringTwo = getCostMonitoring({
        id: reqBody.ids[1],
        isActive: false,
      });

      CostMonitoring.findAll
        .mockResolvedValueOnce([costMonitoringOne, costMonitoringTwo])
        .mockResolvedValueOnce([
          { ...costMonitoringOne, isActive: true },
          { ...costMonitoringTwo, isActive: true },
        ]);
    },
    assert: (_res, reqBody) => {
      expect(CostMonitoring.findAll).toHaveBeenCalledTimes(2);
      expect(CostMonitoring.update).toHaveBeenCalledTimes(1);
      expect(CostMonitoring.update).toHaveBeenCalledWith(
        { isActive: reqBody.action === 'start', lastUpdatedBy: AUTHED_USER_ID },
        {
          where: { id: { [Op.in]: reqBody.ids } },
          transaction: expect.any(Object),
        }
      );
    },
  });

  defineMutationCase({
    title: 'PUT /toggle should return 404 if no ids found',
    method: 'put',
    path: '/api/costMonitoring/toggle',
    buildBody: () => ({
      ids: getUuids(4),
      action: 'start',
    }),
    expectedStatus: 404,
    expectedMessage: 'Cost monitorings not found',
    arrange: () => {
      CostMonitoring.findAll.mockResolvedValue([]);
    },
    assert: () => {
      expect(CostMonitoring.update).not.toHaveBeenCalled();
    },
  });

  defineMutationCase({
    title: 'DELETE /bulk should bulk delete',
    method: 'delete',
    path: '/api/costMonitoring/bulk',
    buildBody: () => ({
      ids: getUuids(4),
    }),
    expectedStatus: 200,
    assertSuccess: true,
    expectedMessage: 'Cost monitoring(s) deleted successfully',
    arrange: () => {
      CostMonitoring.handleDelete.mockResolvedValue(true);
    },
    assert: (_res, reqBody) => {
      expect(CostMonitoring.handleDelete).toHaveBeenCalledWith({
        id: reqBody.ids,
        deletedByUserId: AUTHED_USER_ID,
        transaction: expect.any(Object),
      });
    },
  });

  defineMutationCase({
    title: 'PATCH /bulk should bulk update notification emails',
    method: 'patch',
    path: '/api/costMonitoring/bulk',
    buildBody: () => {
      const costMonitoringOne = getCostMonitoring();
      const costMonitoringTwo = getCostMonitoring({
        metaData: {
          users: ['testuser'],
          notificationMetaData: {
            notificationCondition: 12,
            primaryContacts: ['testemail2@lexisnexisrisk.com'],
          },
        },
      });

      return { costMonitorings: [costMonitoringOne, costMonitoringTwo] };
    },
    expectedStatus: 200,
    assertSuccess: true,
    expectedMessage: 'Cost monitorings updated successfully',
    assert: (_res, reqBody) => {
      const [costMonitoringOne, costMonitoringTwo] = reqBody.costMonitorings;
      expect(
        costMonitoringTwo.metaData.notificationMetaData.primaryContacts
      ).toEqual(['testemail2@lexisnexisrisk.com']);
      expect(CostMonitoring.update).toHaveBeenCalledTimes(2);
      expect(CostMonitoring.update).toHaveBeenCalledWith(
        { metaData: costMonitoringOne.metaData },
        {
          where: { id: costMonitoringOne.id },
          transaction: expect.any(Object),
        }
      );
      expect(CostMonitoring.update).toHaveBeenCalledWith(
        {
          metaData: expect.objectContaining({
            notificationMetaData: expect.objectContaining({
              primaryContacts: ['testemail2@lexisnexisrisk.com'],
            }),
          }),
        },
        {
          where: { id: costMonitoringTwo.id },
          transaction: expect.any(Object),
        }
      );
    },
  });

  defineApiCase({
    title:
      'GET /:applicationId should get all cost monitorings for an application',
    method: 'get',
    path: costMonitoring =>
      `/api/costMonitoring/${costMonitoring.applicationId}`,
    buildEntity: () => getCostMonitoring({ applicationId: uuidv4() }, true),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: costMonitoring => {
      const costMonitorings = [
        costMonitoring,
        getCostMonitoring({ id: uuidv4() }, true),
        getCostMonitoring({ id: uuidv4() }, true),
      ];
      CostMonitoring.findAll.mockResolvedValue(costMonitorings);
    },
    assert: (res, costMonitoring) => {
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0]).toEqual(costMonitoring);
      expect(CostMonitoring.findAll).toHaveBeenCalledTimes(1);
    },
  });

  defineApiCase({
    title: 'GET /byId/:id should get cost monitoring by ID',
    method: 'get',
    path: costMonitoring => `/api/costMonitoring/byId/${costMonitoring.id}`,
    buildEntity: () => getCostMonitoring({}, true),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: costMonitoring => {
      CostMonitoring.findByPk.mockResolvedValue(costMonitoring);
    },
    assert: (res, costMonitoring) => {
      expect(res.body.data).toEqual(costMonitoring);
      expect(CostMonitoring.findByPk).toHaveBeenCalledTimes(1);
    },
  });

  defineApiCase({
    title: 'GET /byId/:id should 404 if invalid monitoring id',
    method: 'get',
    path: costMonitoring => `/api/costMonitoring/byId/${costMonitoring.id}`,
    buildEntity: () => getCostMonitoring({}, true),
    expectedStatus: 404,
    assertSuccess: false,
    arrange: () => {
      CostMonitoring.findByPk.mockResolvedValue(null);
    },
    assert: res => {
      expect(res.body.message).toEqual('Cost monitoring not found');
      expect(CostMonitoring.findByPk).toHaveBeenCalledTimes(1);
    },
  });

  defineApiCase({
    title: 'POST / should create a new cost monitoring',
    method: 'post',
    path: () => '/api/costMonitoring/',
    buildEntity: () => getCostMonitoring({}, true),
    expectedStatus: 201,
    assertSuccess: true,
    arrange: costMonitoring => {
      CostMonitoring.create.mockResolvedValue(costMonitoring);
      CostMonitoring.findByPk.mockResolvedValue(costMonitoring);
    },
    assert: (res, costMonitoring) => {
      expect(res.body.data).toEqual(costMonitoring);
      expect(CostMonitoring.create).toHaveBeenCalledTimes(1);
    },
  });

  defineApiCase({
    title: 'PATCH / should update cost monitoring',
    method: 'patch',
    path: () => '/api/costMonitoring/',
    buildEntity: () => getCostMonitoring({}, true),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: costMonitoring => {
      CostMonitoring.update.mockResolvedValue([1]);
      CostMonitoring.findByPk.mockResolvedValue(costMonitoring);
    },
    assert: (res, costMonitoring) => {
      expect(res.body.data).toEqual(costMonitoring);
      expect(CostMonitoring.update).toHaveBeenCalledTimes(1);
      expect(CostMonitoring.findByPk).toHaveBeenCalledWith(costMonitoring.id, {
        include: expect.any(Array),
      });
    },
  });

  defineApiCase({
    title: 'PATCH / should 404 if ID not found',
    method: 'patch',
    path: () => '/api/costMonitoring/',
    buildEntity: () => getCostMonitoring({}, true),
    expectedStatus: 404,
    assertSuccess: false,
    arrange: () => {
      CostMonitoring.update.mockResolvedValue([0]);
    },
    assert: res => {
      expect(res.body.message).toEqual('Cost monitoring not found');
      expect(CostMonitoring.update).toHaveBeenCalledTimes(1);
    },
  });

  defineApiCase({
    title: 'DELETE / should delete a cost monitoring',
    method: 'delete',
    path: costMonitoring => `/api/costMonitoring/${costMonitoring.id}`,
    buildEntity: () => ({ id: uuidv4() }),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: () => {
      CostMonitoring.handleDelete.mockResolvedValue(true);
    },
    assert: (res, costMonitoring) => {
      expect(res.body.message).toEqual('Cost monitoring deleted successfully');
      expect(CostMonitoring.handleDelete).toHaveBeenCalledWith({
        id: costMonitoring.id,
        deletedByUserId: AUTHED_USER_ID,
        transaction: expect.any(Object),
      });
    },
  });

  defineApiCase({
    title: 'DELETE / should 404 if no rows deleted',
    method: 'delete',
    path: costMonitoring => `/api/costMonitoring/${costMonitoring.id}`,
    buildEntity: () => ({ id: uuidv4() }),
    expectedStatus: 404,
    assertSuccess: false,
    arrange: () => {
      CostMonitoring.handleDelete.mockResolvedValue(0);
    },
    assert: (res, costMonitoring) => {
      expect(res.body.message).toEqual('Cost monitoring not found');
      expect(CostMonitoring.handleDelete).toHaveBeenCalledWith({
        id: costMonitoring.id,
        deletedByUserId: AUTHED_USER_ID,
        transaction: expect.any(Object),
      });
    },
  });
});
