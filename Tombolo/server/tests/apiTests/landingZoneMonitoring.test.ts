import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../test_server.js';
import { mockedModels } from '../mockedModels.js';
const { LandingZoneMonitoring, Cluster } = mockedModels;
import { v4 as uuidv4 } from 'uuid';
import {
  getLandingZoneMonitoring,
  getLandingZoneMonitoringCreatePayload,
  getLandingZoneMonitoringUpdatePayload,
  getMockClusterForApi,
  getFileListQuery,
  nonExistentID,
  AUTHED_USER_ID,
} from '../helpers.js';
import { APPROVAL_STATUS } from '../../config/constants.js';
import {
  defineApiCase,
  defineMutationCase,
  useMonitoringApiRouteLifecycle,
} from './monitoringCrudContract.js';

// Mock HPCC-JS services
vi.mock('@hpcc-js/comms', async () => {
  return {
    TopologyService: class {
      constructor() {}
      TpDropZoneQuery() {
        return Promise.resolve({
          TpDropZones: {
            TpDropZone: [
              {
                Name: 'test_dropzone',
                Path: '/var/lib/HPCCSystems/dropzone',
              },
            ],
          },
        });
      }
    },
    FileSprayService: class {
      constructor() {}
      FileList() {
        return Promise.resolve([{ name: 'file1' }, { name: 'file2' }]);
      }
    },
  };
});

// Mock utility functions
vi.mock('@tombolo/shared', () => ({
  decryptString: vi.fn().mockReturnValue('mocked_password'),
}));

vi.mock('../../utils/getClusterOptions.js', () => ({
  getClusterOptions: vi.fn().mockImplementation(options => options),
}));

const validApplicationId = uuidv4();
const validClusterId = uuidv4();
const validUserId = uuidv4();

describe('Landing Zone Monitoring Routes', () => {
  useMonitoringApiRouteLifecycle();

  const originalEnv = process.env;

  beforeEach(() => {
    // Set up ENCRYPTION_KEY for tests
    process.env = {
      ...originalEnv,
      ENCRYPTION_KEY: 'dGVzdEVuY3J5cHRpb25LZXlGb3JUZXN0aW5nMTIzNDU2',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET /api/landingZoneMonitoring/getDropzones', () => {
    it('should get dropzones for a valid cluster ID', async () => {
      // Mock cluster details
      const mockCluster = getMockClusterForApi(validClusterId);

      Cluster.findOne.mockResolvedValue(mockCluster);

      const res = await request(app)
        .get('/api/landingZoneMonitoring/getDropzones')
        .query({ clusterId: validClusterId });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(Cluster.findOne).toHaveBeenCalledWith({
        where: { id: validClusterId },
        attributes: { exclude: ['metaData'] },
        raw: true,
      });
    });

    it('should return 422 for invalid cluster ID', async () => {
      const res = await request(app)
        .get('/api/landingZoneMonitoring/getDropzones')
        .query({ clusterId: 'invalid-uuid' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should return 422 when cluster ID is missing', async () => {
      const res = await request(app).get(
        '/api/landingZoneMonitoring/getDropzones'
      );

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/landingZoneMonitoring/fileList', () => {
    const validFileListQuery = getFileListQuery(validClusterId);

    it('should get file list with valid parameters', async () => {
      // Mock cluster details
      const mockCluster = getMockClusterForApi(validClusterId);

      Cluster.findOne.mockResolvedValue(mockCluster);

      const res = await request(app)
        .get('/api/landingZoneMonitoring/fileList')
        .query(validFileListQuery);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Cluster.findOne).toHaveBeenCalledWith({
        where: { id: validClusterId },
        attributes: { exclude: ['metaData'] },
        raw: true,
      });
    });

    it('should return 422 for invalid cluster ID in file list', async () => {
      const res = await request(app)
        .get('/api/landingZoneMonitoring/fileList')
        .query({ ...validFileListQuery, clusterId: 'invalid' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 when required parameters are missing', async () => {
      const res = await request(app)
        .get('/api/landingZoneMonitoring/fileList')
        .query({ clusterId: validClusterId });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/landingZoneMonitoring', () => {
    defineApiCase({
      title: 'should create new landing zone monitoring',
      method: 'post',
      path: () => '/api/landingZoneMonitoring',
      buildEntity: () =>
        getLandingZoneMonitoringCreatePayload({
          applicationId: validApplicationId,
          clusterId: validClusterId,
          createdBy: validUserId,
          lastUpdatedBy: validUserId,
        }),
      expectedStatus: 201,
      assertSuccess: true,
      arrange: createPayload => {
        LandingZoneMonitoring.create.mockResolvedValue(createPayload);
      },
      assert: (res, createPayload) => {
        expect(res.body.message).toBe(
          'Landing zone monitoring created successfully'
        );
        expect(res.body.data).toMatchObject(createPayload);
      },
    });

    it('should return 400 for invalid application ID', async () => {
      const invalidPayload = getLandingZoneMonitoringCreatePayload({
        applicationId: 'invalid-appid',
        clusterId: validClusterId,
        createdBy: validUserId,
        lastUpdatedBy: validUserId,
      });

      const res = await request(app)
        .post('/api/landingZoneMonitoring')
        .send(invalidPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should return 422 when required fields are missing', async () => {
      const incompletePayload = {};

      const res = await request(app)
        .post('/api/landingZoneMonitoring')
        .send(incompletePayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should return 422 for invalid monitoring type', async () => {
      const invalidPayload = getLandingZoneMonitoringCreatePayload({
        validApplicationId,
        validClusterId,
        validUserId,
        lzMonitoringType: 'invalidType',
      });

      const res = await request(app)
        .post('/api/landingZoneMonitoring')
        .send(invalidPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/landingZoneMonitoring/all/:applicationId', () => {
    defineApiCase({
      title: 'should get all landing zone monitorings for valid application ID',
      method: 'get',
      path: monitoring =>
        `/api/landingZoneMonitoring/all/${monitoring.applicationId}`,
      buildEntity: () =>
        getLandingZoneMonitoring({ applicationId: validApplicationId }),
      expectedStatus: 200,
      assertSuccess: true,
      arrange: monitoring => {
        const app1 = {
          ...monitoring,
          monitoringName: 'First Monitoring',
        };
        const app2 = getLandingZoneMonitoring({
          applicationId: monitoring.applicationId,
          monitoringName: 'Second Monitor',
        });

        LandingZoneMonitoring.findAll.mockResolvedValue([app1, app2]);
      },
      assert: res => {
        expect(res.body.data).toHaveLength(2);
      },
    });

    it('should return 422 for invalid application ID', async () => {
      const res = await request(app).get(
        '/api/landingZoneMonitoring/all/invalid-uuid'
      );

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    defineApiCase({
      title: 'should return empty array when no monitorings found',
      method: 'get',
      path: monitoring =>
        `/api/landingZoneMonitoring/all/${monitoring.applicationId}`,
      buildEntity: () =>
        getLandingZoneMonitoring({ applicationId: validApplicationId }),
      expectedStatus: 200,
      assertSuccess: true,
      arrange: () => {
        LandingZoneMonitoring.findAll.mockResolvedValue([]);
      },
      assert: res => {
        expect(res.body.data).toHaveLength(0);
      },
    });
  });

  describe('GET /api/landingZoneMonitoring/:id', () => {
    defineApiCase({
      title: 'should get landing zone monitoring by valid ID',
      method: 'get',
      path: monitoring => `/api/landingZoneMonitoring/${monitoring.id}`,
      buildEntity: () =>
        getLandingZoneMonitoring({
          id: uuidv4(),
          applicationId: validApplicationId,
          clusterId: validClusterId,
        }),
      expectedStatus: 200,
      assertSuccess: true,
      arrange: monitoring => {
        LandingZoneMonitoring.findByPk.mockResolvedValue(monitoring);
      },
      assert: (res, monitoring) => {
        expect(res.body.data).toMatchObject(monitoring);
        expect(LandingZoneMonitoring.findByPk).toHaveBeenCalledWith(
          monitoring.id
        );
      },
    });

    defineApiCase({
      title: 'should return 404 when monitoring not found',
      method: 'get',
      path: monitoring => `/api/landingZoneMonitoring/${monitoring.id}`,
      buildEntity: () => ({ id: nonExistentID }),
      expectedStatus: 404,
      assertSuccess: false,
      arrange: () => {
        LandingZoneMonitoring.findByPk.mockResolvedValue(null);
      },
      assert: res => {
        expect(res.body.message).toBe('Landing zone monitoring not found');
      },
    });

    it('should return 422 for invalid ID format', async () => {
      const res = await request(app).get(
        '/api/landingZoneMonitoring/invalid-uuid'
      );

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/landingZoneMonitoring', () => {
    it('should update landing zone monitoring successfully', async () => {
      const existingMonitoring = getLandingZoneMonitoring({
        id: uuidv4(),
        applicationId: validApplicationId,
        clusterId: validClusterId,
      });
      const updatePayload = getLandingZoneMonitoringUpdatePayload(
        existingMonitoring.id,
        validUserId
      );
      const updatedMonitoring = { ...existingMonitoring, ...updatePayload };

      LandingZoneMonitoring.findByPk
        .mockResolvedValueOnce(existingMonitoring) // First call to check existence
        .mockResolvedValueOnce(updatedMonitoring); // Second call to get updated record

      LandingZoneMonitoring.update.mockResolvedValue([1]); // One row updated

      const res = await request(app)
        .patch('/api/landingZoneMonitoring')
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('OK');
      expect(res.body.data).toMatchObject(updatedMonitoring);
    });

    it('should return 404 when updating non-existent monitoring', async () => {
      const updatePayload = getLandingZoneMonitoringUpdatePayload(
        nonExistentID,
        validUserId
      );
      LandingZoneMonitoring.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/landingZoneMonitoring')
        .send(updatePayload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Landing zone monitoring not found');
    });

    it('should return 422 for validation errors', async () => {
      const invalidUpdatePayload = {
        id: 'invalid-uuid',
        monitoringName: 'ab', // Too short
      };

      const res = await request(app)
        .patch('/api/landingZoneMonitoring')
        .send(invalidUpdatePayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reset approval status to pending on update', async () => {
      const existingMonitoring = getLandingZoneMonitoring({
        approvalStatus: APPROVAL_STATUS.APPROVED,
        approvedBy: validUserId,
        approverComment: 'Previously approved',
      });
      const updatePayload = getLandingZoneMonitoringUpdatePayload(
        existingMonitoring.id,
        validUserId
      );

      LandingZoneMonitoring.findByPk.mockResolvedValueOnce(existingMonitoring);
      LandingZoneMonitoring.update.mockResolvedValue([1]);
      LandingZoneMonitoring.findByPk.mockResolvedValueOnce({
        ...existingMonitoring,
        ...updatePayload,
        approvalStatus: APPROVAL_STATUS.PENDING,
        approvedBy: null,
        approverComment: null,
      });

      const res = await request(app)
        .patch('/api/landingZoneMonitoring')
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(LandingZoneMonitoring.update).toHaveBeenCalledWith(
        expect.objectContaining({
          approvalStatus: APPROVAL_STATUS.PENDING,
          approverComment: null,
          approvedBy: null,
          approvedAt: null,
        }),
        { where: { id: existingMonitoring.id }, returning: true }
      );
    });
  });

  describe('DELETE /api/landingZoneMonitoring/:id', () => {
    defineApiCase({
      title: 'should delete landing zone monitoring successfully',
      method: 'delete',
      path: monitoring => `/api/landingZoneMonitoring/${monitoring.id}`,
      buildEntity: () => getLandingZoneMonitoring(),
      expectedStatus: 200,
      assertSuccess: true,
      arrange: monitoring => {
        LandingZoneMonitoring.findByPk.mockResolvedValue(monitoring);
        LandingZoneMonitoring.handleDelete.mockResolvedValue(1);
      },
      assert: (res, monitoring) => {
        expect(res.body.message).toBe(
          'Landing zone monitoring deleted successfully'
        );
        expect(LandingZoneMonitoring.handleDelete).toHaveBeenCalledWith({
          id: monitoring.id,
          deletedByUserId: AUTHED_USER_ID,
        });
      },
    });

    defineApiCase({
      title: 'should return 404 when deleting non-existent monitoring',
      method: 'delete',
      path: monitoring => `/api/landingZoneMonitoring/${monitoring.id}`,
      buildEntity: () => ({ id: nonExistentID }),
      expectedStatus: 404,
      assertSuccess: false,
      arrange: () => {
        LandingZoneMonitoring.findByPk.mockResolvedValue(null);
      },
      assert: res => {
        expect(res.body.message).toBe('Landing zone monitoring not found');
        expect(LandingZoneMonitoring.handleDelete).not.toHaveBeenCalled();
      },
    });

    it('should return 422 for invalid ID format', async () => {
      const res = await request(app).delete(
        '/api/landingZoneMonitoring/invalid-uuid'
      );

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/landingZoneMonitoring/evaluate', () => {
    defineMutationCase({
      title: 'should approve landing zone monitoring successfully',
      method: 'patch',
      path: '/api/landingZoneMonitoring/evaluate',
      buildBody: () => ({
        ids: [uuidv4(), uuidv4()],
        approvalStatus: APPROVAL_STATUS.APPROVED,
        approverComment: 'Looks good, approved for production use',
        approvedBy: validUserId,
        isActive: true,
      }),
      expectedStatus: 200,
      assertSuccess: true,
      expectedMessage: 'OK',
      arrange: () => {
        LandingZoneMonitoring.update.mockResolvedValue([2]);
      },
    });

    defineMutationCase({
      title: 'should reject landing zone monitoring successfully',
      method: 'patch',
      path: '/api/landingZoneMonitoring/evaluate',
      buildBody: () => ({
        ids: [uuidv4()],
        approvalStatus: APPROVAL_STATUS.REJECTED,
        approverComment: 'Security concerns, needs revision',
        approvedBy: validUserId,
        isActive: false,
      }),
      expectedStatus: 200,
      assertSuccess: true,
      expectedMessage: 'OK',
      arrange: () => {
        LandingZoneMonitoring.update.mockResolvedValue([1]);
      },
    });

    defineMutationCase({
      title: 'should return 404 when no records found to evaluate',
      method: 'patch',
      path: '/api/landingZoneMonitoring/evaluate',
      buildBody: () => ({
        ids: [nonExistentID],
        approvalStatus: APPROVAL_STATUS.APPROVED,
        approverComment: 'Test comment',
        approvedBy: validUserId,
      }),
      expectedStatus: 404,
      assertSuccess: false,
      expectedMessage:
        'No landing zone monitoring records found with the provided IDs',
      arrange: () => {
        LandingZoneMonitoring.update.mockResolvedValue([0]);
      },
    });

    it('should return 422 for validation errors in evaluate', async () => {
      const invalidPayload = {
        ids: ['invalid-uuid'],
        approvalStatus: 'invalid-status',
        approverComment: 'abc', // Too short
        approvedBy: 'invalid-user-id',
      };

      const res = await request(app)
        .patch('/api/landingZoneMonitoring/evaluate')
        .send(invalidPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    defineMutationCase({
      title: 'should handle missing isActive field gracefully',
      method: 'patch',
      path: '/api/landingZoneMonitoring/evaluate',
      buildBody: () => ({
        ids: [uuidv4()],
        approvalStatus: APPROVAL_STATUS.APPROVED,
        approverComment: 'Approved without explicit isActive',
        approvedBy: validUserId,
      }),
      expectedStatus: 200,
      arrange: () => {
        LandingZoneMonitoring.update.mockResolvedValue([1]);
      },
      assert: () => {
        expect(LandingZoneMonitoring.update).toHaveBeenCalledWith(
          expect.objectContaining({
            isActive: false,
          }),
          expect.any(Object)
        );
      },
    });
  });

  defineMutationCase({
    title: 'should activate landing zone monitoring successfully',
    method: 'patch',
    path: '/api/landingZoneMonitoring/toggleStatus',
    buildBody: () => ({
      ids: [uuidv4(), uuidv4()],
      isActive: true,
    }),
    expectedStatus: 200,
    assertSuccess: true,
    expectedMessage: 'OK',
    arrange: togglePayload => {
      LandingZoneMonitoring.findAll.mockResolvedValue([
        {
          id: togglePayload.ids[0],
          isActive: false,
          approvalStatus: APPROVAL_STATUS.APPROVED,
        },
        {
          id: togglePayload.ids[1],
          isActive: false,
          approvalStatus: APPROVAL_STATUS.APPROVED,
        },
      ]);
      LandingZoneMonitoring.update.mockResolvedValue([2]);
    },
  });
  // Error handling tests
  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      LandingZoneMonitoring.findAll.mockRejectedValue(
        new Error('Database connection failed')
      );

      const res = await request(app).get(
        `/api/landingZoneMonitoring/all/${validApplicationId}`
      );

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Failed to get landing zone monitoring');
    });
  });
});
