const request = require('supertest');
const { app } = require('../test_server');
const Cluster = require('../../models').cluster;
const { v4: uuidv4 } = require('uuid');
const { blacklistTokenIntervalId } = require('../../utils/tokenBlackListing');
const logger = require('../../config/logger');
const { getCluster } = require('../helpers');

const nonExistentID = uuidv4();

describe('Cluster Routes', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
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
    expect(logger.error).toHaveBeenCalled();
  });

  it('add-cluster Should not create cluster if not in whitelist', async () => {
    const cluster = getCluster();
    cluster.name = 'Not whitelisted Cluster';

    const res = await request(app).post('/api/cluster').send(cluster);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cluster not whitelisted');
    expect(res.body.success).toBe(false);
    expect(Cluster.create).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('update-cluster should update a cluster by ID', async () => {
    const updatedUsername = 'UpdatedUsername';
    const updatedBy = { name: 'Admin', email: 'admin@example.com' };

    const cluster = { ...getCluster(), save: jest.fn() };
    Cluster.findOne.mockResolvedValue(cluster);
    cluster.save.mockResolvedValue(true);

    const res = await request(app).patch(`/api/cluster/${cluster.id}`).send({
      username: updatedUsername,
      updatedBy: updatedBy,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe(updatedUsername);
    expect(res.body.data.updatedBy).toMatchObject(updatedBy);
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
    expect(logger.error).toHaveBeenCalled();
  });

  it('get-cluster-whitelist should get the cluster whitelist', async () => {
    const res = await request(app).get('/api/cluster/whiteList');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('delete-cluster should delete a cluster by ID', async () => {
    const cluster = getCluster();
    Cluster.destroy.mockResolvedValue(true);

    const res = await request(app).delete(`/api/cluster/${cluster.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Cluster.destroy).toHaveBeenCalledWith({
      where: { id: cluster.id },
    });
  });

  it('delete-cluster should 404 if cluster not found', async () => {
    Cluster.destroy.mockResolvedValue(false);

    const res = await request(app).delete(`/api/cluster/${nonExistentID}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Cluster not found');
    expect(Cluster.destroy).toHaveBeenCalledWith({
      where: { id: nonExistentID },
    });
    expect(logger.error).toHaveBeenCalled();
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
