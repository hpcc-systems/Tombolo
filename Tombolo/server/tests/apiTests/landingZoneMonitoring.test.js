const request = require('supertest');
const { app } = require('../test_server');
const LandingZoneMonitoring = require('../../models').landingZoneMonitoring;
const Cluster = require('../../models').cluster;
const { v4: uuidv4 } = require('uuid');
const { blacklistTokenIntervalId } = require('../../utils/tokenBlackListing');
const {
  getLandingZoneMonitoring,
  getLandingZoneMonitoringCreatePayload,
  getLandingZoneMonitoringUpdatePayload,
  getMockClusterForApi,
  getFileListQuery,
  nonExistentID,
} = require('../helpers');

// Mock HPCC-JS services
jest.mock('@hpcc-js/comms', () => ({
  TopologyService: jest.fn().mockImplementation(() => ({
    TpDropZoneQuery: jest.fn().mockResolvedValue({
      TpDropZones: {
        TpDropZone: [
          {
            Name: 'test_dropzone',
            Path: '/var/lib/HPCCSystems/dropzone',
          },
        ],
      },
    }),
  })),
  FileSprayService: jest.fn().mockImplementation(() => ({
    FileList: jest
      .fn()
      .mockResolvedValue([{ name: 'file1' }, { name: 'file2' }]),
  })),
}));

// Mock utility functions
jest.mock('../../utils/cipher', () => ({
  decryptString: jest.fn().mockReturnValue('mocked_password'),
}));

jest.mock('../../utils/getClusterOptions', () => ({
  getClusterOptions: jest.fn().mockImplementation(options => options),
}));

const validApplicationId = uuidv4();
const validClusterId = uuidv4();
const validUserId = uuidv4();

describe('Landing Zone Monitoring Routes', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
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
      expect(Array.isArray(res.body)).toBe(true);
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
    it('should create new landing zone monitoring', async () => {
      const newMonitoring = getLandingZoneMonitoring({
        applicationId: validApplicationId,
        clusterId: validClusterId,
        createdBy: validUserId,
        lastUpdatedBy: validUserId,
      });

      const createPayload = getLandingZoneMonitoringCreatePayload({
        applicationId: validApplicationId,
        clusterId: validClusterId,
        createdBy: validUserId,
        lastUpdatedBy: validUserId,
      });

      LandingZoneMonitoring.create.mockResolvedValue(createPayload);

      const res = await request(app)
        .post('/api/landingZoneMonitoring')
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Landing zone monitoring created successfully'
      );
      expect(res.body.data).toMatchObject(newMonitoring);
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
    it('should get all landing zone monitorings for valid application ID', async () => {
      const app1 = getLandingZoneMonitoring({
        applicationId: validApplicationId,
        monitoringName: 'First Monitoring',
      });
      const app2 = getLandingZoneMonitoring({
        applicationId: validApplicationId,
        monitoringName: 'Second Monitor',
      });
      const monitorings = [app1, app2];

      LandingZoneMonitoring.findAll.mockResolvedValue(monitorings);

      const res = await request(app).get(
        `/api/landingZoneMonitoring/all/${validApplicationId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.count).toBe(2);
    });

    it('should return 422 for invalid application ID', async () => {
      const res = await request(app).get(
        '/api/landingZoneMonitoring/all/invalid-uuid'
      );

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return empty array when no monitorings found', async () => {
      LandingZoneMonitoring.findAll.mockResolvedValue([]);

      const res = await request(app).get(
        `/api/landingZoneMonitoring/all/${validApplicationId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.count).toBe(0);
    });
  });

  describe('GET /api/landingZoneMonitoring/:id', () => {
    it('should get landing zone monitoring by valid ID', async () => {
      const monitoring = getLandingZoneMonitoring({
        id: uuidv4(),
        applicationId: validApplicationId,
        clusterId: validClusterId,
      });
      LandingZoneMonitoring.findByPk.mockResolvedValue(monitoring);

      const res = await request(app).get(
        `/api/landingZoneMonitoring/${monitoring.id}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject(monitoring);
      expect(LandingZoneMonitoring.findByPk).toHaveBeenCalledWith(
        monitoring.id
      );
    });

    it('should return 404 when monitoring not found', async () => {
      LandingZoneMonitoring.findByPk.mockResolvedValue(null);

      const res = await request(app).get(
        `/api/landingZoneMonitoring/${nonExistentID}`
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Landing zone monitoring not found');
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
      expect(res.body.message).toBe(
        'Landing zone monitoring updated successfully'
      );
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
        approvalStatus: 'approved',
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
        approvalStatus: 'Pending',
        approvedBy: null,
        approverComment: null,
      });

      const res = await request(app)
        .patch('/api/landingZoneMonitoring')
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(LandingZoneMonitoring.update).toHaveBeenCalledWith(
        expect.objectContaining({
          approvalStatus: 'Pending',
          approverComment: null,
          approvedBy: null,
          approvedAt: null,
        }),
        { where: { id: existingMonitoring.id }, returning: true }
      );
    });
  });

  describe('DELETE /api/landingZoneMonitoring/:id', () => {
    it('should delete landing zone monitoring successfully', async () => {
      const monitoring = getLandingZoneMonitoring();
      LandingZoneMonitoring.findByPk.mockResolvedValue(monitoring);
      LandingZoneMonitoring.destroy.mockResolvedValue(1);

      const res = await request(app).delete(
        `/api/landingZoneMonitoring/${monitoring.id}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Landing zone monitoring deleted successfully'
      );
      expect(LandingZoneMonitoring.destroy).toHaveBeenCalledWith({
        where: { id: monitoring.id },
      });
    });

    it('should return 404 when deleting non-existent monitoring', async () => {
      LandingZoneMonitoring.findByPk.mockResolvedValue(null);

      const res = await request(app).delete(
        `/api/landingZoneMonitoring/${nonExistentID}`
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Landing zone monitoring not found');
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
    it('should approve landing zone monitoring successfully', async () => {
      const monitoringIds = [uuidv4(), uuidv4()];
      const evaluatePayload = {
        ids: monitoringIds,
        approvalStatus: 'approved',
        approverComment: 'Looks good, approved for production use',
        approvedBy: validUserId,
        isActive: true,
      };

      LandingZoneMonitoring.update.mockResolvedValue([2]); // Two rows updated

      const res = await request(app)
        .patch('/api/landingZoneMonitoring/evaluate')
        .send(evaluatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Successfully approved 2 landing zone monitoring record(s)'
      );
    });

    it('should reject landing zone monitoring successfully', async () => {
      const monitoringIds = [uuidv4()];
      const evaluatePayload = {
        ids: monitoringIds,
        approvalStatus: 'rejected',
        approverComment: 'Security concerns, needs revision',
        approvedBy: validUserId,
        isActive: false,
      };

      LandingZoneMonitoring.update.mockResolvedValue([1]);

      const res = await request(app)
        .patch('/api/landingZoneMonitoring/evaluate')
        .send(evaluatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Successfully rejected 1 landing zone monitoring record(s)'
      );
    });

    it('should return 404 when no records found to evaluate', async () => {
      const evaluatePayload = {
        ids: [nonExistentID],
        approvalStatus: 'approved',
        approverComment: 'Test comment',
        approvedBy: validUserId,
      };

      LandingZoneMonitoring.update.mockResolvedValue([0]); // No rows updated

      const res = await request(app)
        .patch('/api/landingZoneMonitoring/evaluate')
        .send(evaluatePayload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'No landing zone monitoring records found with the provided IDs'
      );
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

    it('should handle missing isActive field gracefully', async () => {
      const evaluatePayload = {
        ids: [uuidv4()],
        approvalStatus: 'approved',
        approverComment: 'Approved without explicit isActive',
        approvedBy: validUserId,
        // isActive is optional
      };

      LandingZoneMonitoring.update.mockResolvedValue([1]);

      const res = await request(app)
        .patch('/api/landingZoneMonitoring/evaluate')
        .send(evaluatePayload);

      expect(res.status).toBe(200);
      expect(LandingZoneMonitoring.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false, // Should default to false
        }),
        expect.any(Object)
      );
    });
  });

  describe('PATCH /api/landingZoneMonitoring/toggleStatus', () => {
    it('should activate landing zone monitoring successfully', async () => {
      const monitoringIds = [uuidv4(), uuidv4()];
      const togglePayload = {
        ids: monitoringIds,
        isActive: true,
      };

      LandingZoneMonitoring.findAll.mockResolvedValue([
        { id: monitoringIds[0], isActive: false },
        { id: monitoringIds[1], isActive: false },
      ]);
      LandingZoneMonitoring.update.mockResolvedValue([2]);

      const res = await request(app)
        .patch('/api/landingZoneMonitoring/toggleStatus')
        .send(togglePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Successfully activated 2 landing zone monitoring record(s)'
      );
      expect(res.body.updatedCount).toBe(2);
      expect(res.body.newStatus).toBe(true);
    });

    it('should deactivate landing zone monitoring successfully', async () => {
      const monitoringIds = [uuidv4()];
      const togglePayload = {
        ids: monitoringIds,
        isActive: false,
      };

      LandingZoneMonitoring.findAll.mockResolvedValue([
        { id: monitoringIds[0], isActive: true },
      ]);
      LandingZoneMonitoring.update.mockResolvedValue([1]);

      const res = await request(app)
        .patch('/api/landingZoneMonitoring/toggleStatus')
        .send(togglePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Successfully deactivated 1 landing zone monitoring record(s)'
      );
    });

    it('should return 404 when no records found to toggle', async () => {
      const togglePayload = {
        ids: [nonExistentID],
        isActive: true,
      };

      LandingZoneMonitoring.findAll.mockResolvedValue([]);

      const res = await request(app)
        .patch('/api/landingZoneMonitoring/toggleStatus')
        .send(togglePayload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'No landing zone monitoring records found with the provided IDs'
      );
    });

    it('should return 422 for validation errors in toggle status', async () => {
      const invalidPayload = {
        ids: [], // Empty array
        isActive: 'not-boolean',
      };

      const res = await request(app)
        .patch('/api/landingZoneMonitoring/toggleStatus')
        .send(invalidPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 when isActive is missing', async () => {
      const invalidPayload = {
        ids: [uuidv4()],
        // Missing isActive field
      };

      const res = await request(app)
        .patch('/api/landingZoneMonitoring/toggleStatus')
        .send(invalidPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
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
      expect(res.body.message).toBe('Failed to get landing zone monitorings');
    });
  });
});
