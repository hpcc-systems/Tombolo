import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../test_server.js';
import { Cluster } from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import { blacklistTokenIntervalId } from '../../utils/tokenBlackListing.js';
import { getCluster, AUTHED_USER_ID, UUID_REGEX } from '../helpers.js';

const nonExistentID = uuidv4();

describe('Cluster Routes', () => {
  beforeEach(() => {
    vi.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('get-clusters should get all clusters', async () => {
    const cluster = getCluster();
    Cluster.findAll.mockResolvedValue([cluster]);

    const res = await request(app).get('/api/cluster');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toMatchObject(cluster);
    expect(Cluster.findAll).toHaveBeenCalledTimes(1);
  });

  it('get-cluster-by-id should get a cluster by ID', async () => {
    const cluster = getCluster();
    Cluster.findOne.mockResolvedValue(cluster);

    const res = await request(app).get(`/api/cluster/getOne/${cluster.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(cluster);
  });

  it('get-cluster-by-id should 404 if cluster does not exist', async () => {
    Cluster.findOne.mockResolvedValue(null);

    const res = await request(app).get(`/api/cluster/getOne/${nonExistentID}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Cluster not found');
    expect(Cluster.findOne).toHaveBeenCalledTimes(1);
  });

  it('add-cluster Should not create cluster if not in whitelist', async () => {
    const cluster = getCluster();
    cluster.name = 'Not whitelisted Cluster';

    const res = await request(app).post('/api/cluster').send(cluster);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cluster not whitelisted');
    expect(res.body.success).toBe(false);
    expect(Cluster.create).not.toHaveBeenCalled();
  });

  it('update-cluster should update a cluster by ID', async () => {
    const updatedUsername = 'UpdatedUsername';

    const cluster = { ...getCluster(), save: vi.fn() };
    Cluster.findOne.mockResolvedValue(cluster);
    cluster.save.mockResolvedValue(true);

    const res = await request(app).patch(`/api/cluster/${cluster.id}`).send({
      username: updatedUsername,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe(updatedUsername);
    expect(res.body.data.updatedBy).toMatch(UUID_REGEX);
    expect(Cluster.findOne).toHaveBeenCalledTimes(1);
    expect(cluster.save).toHaveBeenCalledTimes(1);
  });

  it('update-cluster should 404 if cluster not found', async () => {
    Cluster.findOne.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/cluster/${nonExistentID}`)
      .send({
        username: 'UpdatedUsername',
        updatedBy: { name: 'Admin', email: 'admin@example.com' },
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Cluster not found');
  });

  it('get-cluster-whitelist should get the cluster whitelist', async () => {
    const res = await request(app).get('/api/cluster/whiteList');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('delete-cluster should delete a cluster by ID', async () => {
    const cluster = getCluster();
    Cluster.handleDelete.mockResolvedValue(true);

    const res = await request(app).delete(`/api/cluster/${cluster.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Cluster.handleDelete).toHaveBeenCalledWith({
      id: cluster.id,
      deletedByUserId: AUTHED_USER_ID,
    });
  });

  it('delete-cluster should 404 if cluster not found', async () => {
    Cluster.handleDelete.mockResolvedValue(0);

    const res = await request(app).delete(`/api/cluster/${nonExistentID}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Cluster not found');
    expect(Cluster.handleDelete).toHaveBeenCalledWith({
      id: nonExistentID,
      deletedByUserId: AUTHED_USER_ID,
    });
  });

  it('add-cluster-w-progress should add cluster with progress', async () => {});

  it('ping-cluster should ping cluster', async () => {
    const cluster = getCluster();

    const res = await request(app).post('/api/cluster/ping').send({
      name: cluster.name,
      username: cluster.username,
      password: cluster.hash,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Cluster reachable');
  });

  it('ping-existing-cluster should ping existing cluster', async () => {
    const cluster = getCluster();
    Cluster.findOne.mockResolvedValue(cluster);

    Cluster.update.mockResolvedValue(true);

    const res = await request(app).get(
      `/api/cluster/pingExistingCluster/${cluster.id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Reachable');
    expect(Cluster.findOne).toHaveBeenCalledTimes(1);
    expect(Cluster.update).toHaveBeenCalledTimes(1);
  });
});
