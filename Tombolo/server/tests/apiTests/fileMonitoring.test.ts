import { vi, describe, expect, beforeAll } from 'vitest';
import { mockedModels } from '../mockedModels.js';
const { FileMonitoring, sequelize } = mockedModels;
import { v4 as uuidv4 } from 'uuid';
import { AUTHED_USER_ID } from '../helpers.js';
import { APPROVAL_STATUS } from '../../config/constants.js';
import {
  defineApiCase,
  defineMutationCase,
  useMonitoringApiRouteLifecycle,
} from './monitoringCrudContract.js';

beforeAll(async () => {
  const consoleModule = await import('console');
  global.console = consoleModule.default; // restore native console
});

vi.mock('@tombolo/db', async () => {
  const actual = await vi.importActual('@tombolo/db');
  return {
    ...actual,
    FileMonitoring: {
      create: vi.fn(),
      update: vi.fn(),
      findByPk: vi.fn(),
      findAll: vi.fn(),
      destroy: vi.fn(),
    },
    Cluster: {
      findOne: vi.fn(),
    },
  };
});

// Helper to generate a file monitoring payload
function getFileMonitoringPayload(overrides = {}) {
  return {
    id: uuidv4(),
    applicationId: uuidv4(),
    clusterId: uuidv4(),
    monitoringName: 'Test File Monitor',
    description: 'Test file monitoring description',
    metaData: { users: ['testuser1'] },
    isActive: false,
    approvalStatus: APPROVAL_STATUS.PENDING,
    approvedBy: null,
    approvedAt: null,
    approverComment: null,
    createdBy: AUTHED_USER_ID,
    lastUpdatedBy: AUTHED_USER_ID,
    ...overrides,
  };
}

describe('File Monitoring API', () => {
  useMonitoringApiRouteLifecycle();

  defineApiCase({
    title: 'POST /api/fileMonitoring should create a new file monitoring',
    method: 'post',
    path: () => '/api/fileMonitoring',
    buildEntity: () => getFileMonitoringPayload(),
    expectedStatus: 201,
    assertSuccess: true,
    arrange: payload => {
      FileMonitoring.create.mockResolvedValue(payload);
      FileMonitoring.findByPk.mockResolvedValue(payload);
    },
    assert: (res, payload) => {
      expect(res.body.data).toMatchObject(payload);
    },
  });

  defineApiCase({
    title: 'GET /api/fileMonitoring/:id should get file monitoring by id',
    method: 'get',
    path: payload => `/api/fileMonitoring/${payload.id}`,
    buildEntity: () => getFileMonitoringPayload(),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: payload => {
      FileMonitoring.findByPk.mockResolvedValue(payload);
    },
    assert: (res, payload) => {
      expect(res.body.data).toMatchObject(payload);
    },
  });

  defineApiCase({
    title: 'PUT /api/fileMonitoring/:id should update file monitoring',
    method: 'put',
    path: payload => `/api/fileMonitoring/${payload.id}`,
    buildEntity: () => getFileMonitoringPayload(),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: payload => {
      FileMonitoring.update.mockResolvedValue([1]);
      FileMonitoring.findByPk.mockResolvedValue(payload);
    },
    assert: (res, payload) => {
      expect(res.body.data).toMatchObject(payload);
    },
  });

  defineApiCase({
    title:
      'GET /api/fileMonitoring/all/:applicationId should get all file monitorings for an application',
    method: 'get',
    path: payload => `/api/fileMonitoring/all/${payload.applicationId}`,
    buildEntity: () => getFileMonitoringPayload(),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: payload => {
      FileMonitoring.findAll.mockResolvedValue([payload]);
    },
    assert: res => {
      expect(Array.isArray(res.body.data)).toBe(true);
    },
  });

  defineMutationCase({
    title: 'PATCH /api/fileMonitoring/evaluate should evaluate file monitoring',
    method: 'patch',
    path: '/api/fileMonitoring/evaluate',
    buildBody: () => ({
      ids: [uuidv4()],
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approverComment: 'Looks good',
      approvedBy: AUTHED_USER_ID,
      isActive: true,
    }),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: () => {
      FileMonitoring.findAll.mockResolvedValue([getFileMonitoringPayload()]);
      FileMonitoring.update.mockResolvedValue([1]);
    },
  });

  defineMutationCase({
    title:
      'PATCH /api/fileMonitoring/toggle should toggle file monitoring active status',
    method: 'patch',
    path: '/api/fileMonitoring/toggle',
    buildBody: () => ({ ids: [uuidv4()], isActive: true }),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: () => {
      FileMonitoring.findAll.mockResolvedValue([getFileMonitoringPayload()]);
      FileMonitoring.update.mockResolvedValue([1]);
    },
  });

  defineMutationCase({
    title: 'DELETE /api/fileMonitoring should delete file monitoring',
    method: 'delete',
    path: '/api/fileMonitoring',
    buildBody: () => ({ ids: [uuidv4()] }),
    expectedStatus: 200,
    assertSuccess: true,
    arrange: () => {
      const commit = vi.fn();
      const rollback = vi.fn();
      vi.spyOn(sequelize, 'transaction').mockResolvedValue({
        commit,
        rollback,
      });

      FileMonitoring.update = vi.fn().mockResolvedValue([1]);
      FileMonitoring.destroy = vi.fn().mockResolvedValue(1);
    },
    assert: () => {
      expect(FileMonitoring.update).toHaveBeenCalled();
      expect(FileMonitoring.destroy).toHaveBeenCalled();
      expect(sequelize.transaction).toHaveBeenCalled();
    },
  });
});
