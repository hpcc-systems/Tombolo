import { vi, describe, expect } from 'vitest';
import { mockedModels } from '../mockedModels.js';
const { ClusterMonitoring } = mockedModels;

import {
  getClusterMonitoring,
  UUID_REGEX,
  AUTHED_USER_ID,
} from '../helpers.js';
import { v4 as uuidv4 } from 'uuid';
import { APPROVAL_STATUS } from '../../config/constants.js';
import {
  defineApiCase,
  defineMutationCase,
  useMonitoringApiRouteLifecycle,
} from './monitoringCrudContract.js';

const monitoringId = uuidv4();

describe('Cluster Monitoring routes Routes', () => {
  useMonitoringApiRouteLifecycle();

  defineApiCase({
    title: 'POST / should create a new cluster monitoring',
    method: 'post',
    path: () => '/api/clusterMonitoring',
    buildEntity: () => getClusterMonitoring({ id: monitoringId }),
    expectedStatus: 201,
    arrange: monitoring => {
      ClusterMonitoring.create.mockResolvedValue(monitoring);
    },
  });

  defineApiCase({
    title: 'GET /:id should return a monitoring',
    method: 'get',
    path: monitoring => `/api/clusterMonitoring/${monitoring.id}`,
    buildEntity: () => getClusterMonitoring({ id: monitoringId }),
    expectedStatus: 200,
    arrange: monitoring => {
      ClusterMonitoring.findOne.mockResolvedValue(monitoring);
    },
  });

  defineApiCase({
    title: 'GET / should return all cluster status monitoring',
    method: 'get',
    path: () => '/api/clusterMonitoring',
    buildEntity: () => getClusterMonitoring(),
    expectedStatus: 200,
    arrange: monitoring => {
      ClusterMonitoring.findAll.mockResolvedValue([monitoring]);
    },
    assert: (res, monitoring) => {
      expect(res.body.data).toEqual([monitoring]);
    },
  });

  defineApiCase({
    title: 'PUT / should update an existing cluster status monitoring',
    method: 'put',
    path: () => '/api/clusterMonitoring',
    buildEntity: () => ({
      ...getClusterMonitoring({ id: monitoringId }),
      update: vi.fn(),
    }),
    expectedStatus: 200,
    arrange: monitoring => {
      monitoring.update.mockResolvedValue(monitoring);
      ClusterMonitoring.findOne.mockResolvedValue(monitoring);
    },
    requestBody: monitoring => ({
      ...monitoring,
      description: 'Updated description',
    }),
  });

  defineMutationCase({
    title: 'PATCH /toggleStatus should toggle monitoring status',
    method: 'patch',
    path: '/api/clusterMonitoring/toggle',
    buildBody: () => ({ id: monitoringId }),
    expectedStatus: 200,
    expectedMessage: 'Cluster status monitoring status updated successfully',
    arrange: reqBody => {
      const monitoring = getClusterMonitoring({
        id: reqBody.id,
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: false,
      });
      ClusterMonitoring.findOne.mockResolvedValue(monitoring);
    },
    assert: (_res, reqBody) => {
      expect(ClusterMonitoring.update).toHaveBeenCalledWith(
        {
          isActive: true,
          lastUpdatedBy: expect.stringMatching(UUID_REGEX),
        },
        {
          where: { id: reqBody.id },
        }
      );
    },
  });

  defineMutationCase({
    title: 'PATCH /evaluate should evaluate monitoring approval status',
    method: 'patch',
    path: '/api/clusterMonitoring/evaluate',
    buildBody: () => ({
      ids: [monitoringId],
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approverComment: 'Approved by admin',
    }),
    expectedStatus: 200,
    arrange: () => {
      const monitoring = getClusterMonitoring({
        id: monitoringId,
        approvalStatus: APPROVAL_STATUS.PENDING,
      });
      ClusterMonitoring.findAll.mockResolvedValue([monitoring]);
    },
  });

  defineMutationCase({
    title: 'PATCH /bulkUpdate should bulk update monitoring contacts',
    method: 'patch',
    path: '/api/clusterMonitoring/bulkUpdate',
    buildBody: () => ({
      clusterMonitoring: [
        {
          id: uuidv4(),
          primaryContacts: ['primary@test.com'],
          secondaryContacts: ['secondary@test.com'],
          notifyContacts: ['notify@test.com'],
        },
        {
          id: uuidv4(),
          primaryContacts: ['xx@test.com'],
          secondaryContacts: ['aa@test.com'],
        },
      ],
    }),
    expectedStatus: [200, 207],
    arrange: reqBody => {
      ClusterMonitoring.findAll.mockResolvedValue(
        reqBody.clusterMonitoring.map(m => ({
          id: m.id,
          metaData: { contacts: {} },
        }))
      );
      ClusterMonitoring.update.mockResolvedValue([1]);
    },
  });

  defineMutationCase({
    title: 'DELETE / should delete a monitoring',
    method: 'delete',
    path: '/api/clusterMonitoring',
    buildBody: () => ({ ids: [uuidv4(), uuidv4()] }),
    expectedStatus: 200,
    arrange: () => {
      ClusterMonitoring.handleDelete.mockResolvedValue(1);
    },
    assert: (_res, reqBody) => {
      expect(ClusterMonitoring.handleDelete).toHaveBeenCalledWith({
        id: reqBody.ids,
        deletedByUserId: AUTHED_USER_ID,
        transaction: expect.any(Object),
      });
    },
  });
});
