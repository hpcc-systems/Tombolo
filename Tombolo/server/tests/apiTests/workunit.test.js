import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { blacklistTokenIntervalId } from '../../utils/tokenBlackListing.js';
import request from 'supertest';
import { app } from '../test_server.js';
import { v4 as uuidv4 } from 'uuid';
import { WorkUnit, WorkUnitDetails } from '../../models/index.js';
import { getWorkUnit, getWorkUnitDetails } from '../helpers.js';

describe('Workunit Routes', () => {
  beforeEach(() => {
    vi.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe('GET /api/workunits', () => {
    it('should return paginated list of workunits', async () => {
      const workunits = [
        getWorkUnit({}, true),
        getWorkUnit({ wuId: 'W20241203-234567' }, true),
        getWorkUnit({ wuId: 'W20241203-345678' }, true),
      ];

      WorkUnit.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: workunits,
      });

      const res = await request(app).get('/api/workunits').query({
        page: 1,
        limit: 50,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(50);
      expect(res.body.data.data.length).toBe(3);
      expect(WorkUnit.findAndCountAll).toHaveBeenCalledTimes(1);
    });

    it('should filter workunits by clusterId', async () => {
      const clusterId = uuidv4();
      const workunits = [
        getWorkUnit({ clusterId }, true),
        getWorkUnit({ clusterId, wuId: 'W20241203-234567' }, true),
      ];

      WorkUnit.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: workunits,
      });

      const res = await request(app).get('/api/workunits').query({
        clusterId,
        page: 1,
        limit: 50,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(WorkUnit.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clusterId }),
        })
      );
    });

    it('should filter workunits by state', async () => {
      const workunits = [
        getWorkUnit({ state: 'completed' }, true),
        getWorkUnit({ wuId: 'W20241203-234567', state: 'completed' }, true),
      ];

      WorkUnit.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: workunits,
      });

      const res = await request(app).get('/api/workunits').query({
        state: 'completed',
        page: 1,
        limit: 50,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(WorkUnit.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            state: expect.any(Object),
          }),
        })
      );
    });

    it('should filter workunits by owner', async () => {
      const workunits = [getWorkUnit({ owner: 'testuser' }, true)];

      WorkUnit.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: workunits,
      });

      const res = await request(app).get('/api/workunits').query({
        owner: 'testuser',
        page: 1,
        limit: 50,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(1);
      expect(WorkUnit.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            owner: expect.any(Object),
          }),
        })
      );
    });

    it('should sort workunits by totalCost', async () => {
      const workunits = [
        getWorkUnit({ totalCost: 50.0 }, true),
        getWorkUnit({ wuId: 'W20241203-234567', totalCost: 30.0 }, true),
        getWorkUnit({ wuId: 'W20241203-345678', totalCost: 10.0 }, true),
      ];

      WorkUnit.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: workunits,
      });

      const res = await request(app).get('/api/workunits').query({
        sort: 'totalCost',
        order: 'desc',
        page: 1,
        limit: 50,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(WorkUnit.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['totalCost', 'desc']],
        })
      );
    });

    it('should apply pagination correctly', async () => {
      const workunits = [getWorkUnit({}, true), getWorkUnit({}, true)];

      WorkUnit.findAndCountAll.mockResolvedValue({
        count: 100,
        rows: workunits,
      });

      const res = await request(app).get('/api/workunits').query({
        page: 2,
        limit: 10,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.page).toBe(2);
      expect(res.body.data.limit).toBe(10);
      expect(WorkUnit.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 10,
          limit: 10,
        })
      );
    });
  });

  describe('GET /api/workunits/:clusterId/:wuid', () => {
    it('should return a single workunit', async () => {
      const workunit = getWorkUnit({}, true);

      WorkUnit.findOne.mockResolvedValue({
        get: () => workunit,
      });

      const res = await request(app).get(
        `/api/workunits/${workunit.clusterId}/${workunit.wuId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wuId).toBe(workunit.wuId);
      expect(res.body.data.clusterId).toBe(workunit.clusterId);
      expect(WorkUnit.findOne).toHaveBeenCalledWith({
        where: {
          wuId: workunit.wuId,
          clusterId: workunit.clusterId,
        },
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
      });
    });

    it('should return 404 if workunit not found', async () => {
      const clusterId = uuidv4();
      const wuId = 'W20241203-999999';

      WorkUnit.findOne.mockResolvedValue(null);

      const res = await request(app).get(`/api/workunits/${clusterId}/${wuId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Workunit not found');
    });
  });

  describe('GET /api/workunits/:clusterId/:wuid/details', () => {
    it('should return workunit details with hierarchical structure', async () => {
      const clusterId = uuidv4();
      const wuId = 'W20241203-123456';
      const details = [
        {
          ...getWorkUnitDetails({
            clusterId,
            wuId,
            scopeId: 'graph1',
            scopeType: 'graph',
            scopeName: 'TestGraph',
          }),
          get: function () {
            return this;
          },
        },
        {
          ...getWorkUnitDetails({
            clusterId,
            wuId,
            scopeId: 'graph1:subgraph1',
            scopeType: 'subgraph',
            scopeName: 'TestSubgraph',
          }),
          get: function () {
            return this;
          },
        },
      ];

      WorkUnitDetails.findAll.mockResolvedValue(details);

      const res = await request(app).get(
        `/api/workunits/${clusterId}/${wuId}/details`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wuId).toBe(wuId);
      expect(res.body.data.clusterId).toBe(clusterId);
      expect(res.body.data.graphs).toBeDefined();
      expect(Array.isArray(res.body.data.graphs)).toBe(true);
      expect(WorkUnitDetails.findAll).toHaveBeenCalledWith({
        where: { wuId, clusterId },
        order: [['id', 'ASC']],
      });
    });

    it('should return 404 if no details found', async () => {
      const clusterId = uuidv4();
      const wuId = 'W20241203-999999';

      WorkUnitDetails.findAll.mockResolvedValue([]);

      const res = await request(app).get(
        `/api/workunits/${clusterId}/${wuId}/details`
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No details found for this workunit');
    });
  });

  describe('GET /api/workunits/:clusterId/:wuid/hotspots', () => {
    it('should return workunit hotspots sorted by TimeElapsed', async () => {
      const clusterId = uuidv4();
      const wuId = 'W20241203-123456';
      const details = [
        {
          ...getWorkUnitDetails({
            clusterId,
            wuId,
            TimeElapsed: 5000.0,
            scopeName: 'SlowActivity1',
          }),
          get: function () {
            return this;
          },
        },
        {
          ...getWorkUnitDetails({
            clusterId,
            wuId,
            TimeElapsed: 4000.0,
            scopeName: 'SlowActivity2',
          }),
          get: function () {
            return this;
          },
        },
        {
          ...getWorkUnitDetails({
            clusterId,
            wuId,
            TimeElapsed: 3000.0,
            scopeName: 'SlowActivity3',
          }),
          get: function () {
            return this;
          },
        },
      ];

      WorkUnitDetails.findAll.mockResolvedValue(details);

      const res = await request(app).get(
        `/api/workunits/${clusterId}/${wuId}/hotspots`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(WorkUnitDetails.findAll).toHaveBeenCalledWith({
        where: { wuId, clusterId },
        order: [['TimeElapsed', 'DESC']],
        limit: 15,
      });
    });

    it('should respect limit parameter', async () => {
      const clusterId = uuidv4();
      const wuId = 'W20241203-123456';
      const details = [
        {
          ...getWorkUnitDetails({ clusterId, wuId }),
          get: function () {
            return this;
          },
        },
      ];

      WorkUnitDetails.findAll.mockResolvedValue(details);

      const res = await request(app)
        .get(`/api/workunits/${clusterId}/${wuId}/hotspots`)
        .query({ limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(WorkUnitDetails.findAll).toHaveBeenCalledWith({
        where: { wuId, clusterId },
        order: [['TimeElapsed', 'DESC']],
        limit: 5,
      });
    });
  });

  describe('GET /api/workunits/:clusterId/:wuid/timeline', () => {
    it('should return workunit timeline sorted by TimeFirstRow', async () => {
      const clusterId = uuidv4();
      const wuId = 'W20241203-123456';
      const details = [
        {
          ...getWorkUnitDetails({
            clusterId,
            wuId,
            TimeFirstRow: 100.0,
            scopeName: 'Activity1',
          }),
          get: function () {
            return this;
          },
        },
        {
          ...getWorkUnitDetails({
            clusterId,
            wuId,
            TimeFirstRow: 200.0,
            scopeName: 'Activity2',
          }),
          get: function () {
            return this;
          },
        },
        {
          ...getWorkUnitDetails({
            clusterId,
            wuId,
            TimeFirstRow: 300.0,
            scopeName: 'Activity3',
          }),
          get: function () {
            return this;
          },
        },
      ];

      WorkUnitDetails.findAll.mockResolvedValue(details);

      const res = await request(app).get(
        `/api/workunits/${clusterId}/${wuId}/timeline`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(WorkUnitDetails.findAll).toHaveBeenCalledWith({
        where: { wuId, clusterId },
        order: [['TimeFirstRow', 'ASC']],
      });
    });
  });
});
