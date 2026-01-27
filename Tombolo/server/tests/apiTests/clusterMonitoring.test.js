import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { blacklistTokenIntervalId } from '../../utils/tokenBlackListing.js';
import request from 'supertest';
import { app } from '../test_server.js';
import { ClusterMonitoring } from '../../models/index.js';

import {
  getClusterMonitoring,
  UUID_REGEX,
  AUTHED_USER_ID,
} from '../helpers.js';
import { v4 as uuidv4 } from 'uuid';
import { APPROVAL_STATUS } from '../../config/constants.js';

const monitoringId = uuidv4();

describe('Cluster Monitoring routes Routes', () => {
  beforeEach(() => {
    vi.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  // Create new cluster  monitoring
  it('POST / should create a new cluster  monitoring', async () => {
    const monitoring = getClusterMonitoring({ id: monitoringId });
    ClusterMonitoring.create.mockResolvedValue(monitoring);

    const res = await request(app)
      .post('/api/clusterMonitoring')
      .send(monitoring);

    expect(res.status).toBe(201);
  });

  // Get one cluster status monitoring by ID
  it('GET /:id should return a  monitoring', async () => {
    const monitoring = getClusterMonitoring({ id: monitoringId });
    ClusterMonitoring.findOne.mockResolvedValue(monitoring);

    const res = await request(app).get(
      `/api/clusterMonitoring/${monitoringId}`
    );

    expect(res.status).toBe(200);
  });

  // Get All cluster status monitoring
  it('GET / should return all cluster status monitoring', async () => {
    const monitoring = getClusterMonitoring();
    ClusterMonitoring.findAll.mockResolvedValue([monitoring]);

    const res = await request(app).get('/api/clusterMonitoring');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([monitoring]);
  });

  // Update existing cluster status monitoring
  it('PUT / should update an existing cluster status monitoring', async () => {
    const monitoring = getClusterMonitoring({ id: monitoringId });

    // Mock the instance update method
    monitoring.update = vi.fn().mockResolvedValue(monitoring);

    ClusterMonitoring.findOne.mockResolvedValue(monitoring);

    const updatePayload = {
      ...monitoring,
      description: 'Updated description',
    };

    const res = await request(app)
      .put('/api/clusterMonitoring')
      .send(updatePayload);

    expect(res.status).toBe(200);
  });

  // Toggle cluster status monitoring status
  it('PATCH /toggleStatus should toggle monitoring status', async () => {
    const monitoring = getClusterMonitoring({
      id: monitoringId,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      isActive: false,
    });

    ClusterMonitoring.findOne.mockResolvedValue(monitoring);

    const res = await request(app)
      .patch('/api/clusterMonitoring/toggle')
      .send({ id: monitoringId }); // Send ID in body!

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(
      'Cluster status monitoring status updated successfully'
    );
    expect(ClusterMonitoring.update).toHaveBeenCalledWith(
      {
        isActive: !monitoring.isActive,
        lastUpdatedBy: expect.stringMatching(UUID_REGEX),
      },
      {
        where: { id: monitoringId },
      }
    );
  });

  // Update approval status of cluster status monitoring
  it('PATCH /evaluate should evaluate monitoring approval status', async () => {
    const monitoring = getClusterMonitoring({
      id: monitoringId,
      approvalStatus: APPROVAL_STATUS.PENDING,
    });

    ClusterMonitoring.findAll.mockResolvedValue([monitoring]);

    const res = await request(app)
      .patch('/api/clusterMonitoring/evaluate')
      .send({
        ids: [monitoringId],
        approvalStatus: APPROVAL_STATUS.APPROVED,
        approverComment: 'Approved by admin',
      });

    expect(res.status).toBe(200);
  });

  // Bulk update cluster status monitoring contacts
  it('PATCH /bulkUpdate should bulk update monitoring contacts', async () => {
    const completePayload = {
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
    };

    const res = await request(app)
      .patch('/api/clusterMonitoring/bulkUpdate')
      .send(completePayload);

    expect([200, 207]).toContain(res.status);
  });

  // delete cluster status monitoring
  it('DELETE / should delete a monitoring', async () => {
    const monitoringIds = [uuidv4(), uuidv4()];
    ClusterMonitoring.handleDelete.mockResolvedValue(1);

    const res = await request(app)
      .delete('/api/clusterMonitoring')
      .send({ ids: monitoringIds });

    expect(res.status).toBe(200);
    expect(ClusterMonitoring.handleDelete).toHaveBeenCalledWith({
      id: monitoringIds,
      deletedByUserId: AUTHED_USER_ID,
      transaction: expect.any(Object),
    });
  });
});
