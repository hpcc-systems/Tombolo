const { blacklistTokenIntervalId } = require('../../utils/tokenBlackListing');
const request = require('supertest');
const { app } = require('../test_server');
const { v4: uuidv4 } = require('uuid');
const { CostMonitoring } = require('../../models');
const {
  getUuids,
  getCostMonitoring,
  ISO_DATE_REGEX,
  UUID_REGEX,
  AUTHED_USER_ID,
} = require('../helpers');
const { Op } = require('sequelize');
const { getUserFkIncludes } = require('../../utils/getUserFkIncludes');
const { APPROVAL_STATUS } = require('../../config/constants');

describe('costMonitoring Routes', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('PATCH /evaluate should evaluate one monitoring', async () => {
    const uuid = uuidv4();
    const reqBody = {
      ids: [uuid],
      isActive: true,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approverComment: 'Test Approval Comment',
    };

    const res = await request(app)
      .patch('/api/costMonitoring/evaluate')
      .send(reqBody);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Cost monitoring(s) evaluated successfully');
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
          id: { [Op.in]: [uuid] },
        },
        include: getUserFkIncludes(true),
      }
    );
  });

  it('PATCH /evaluate should evaluate multiple monitorings', async () => {
    const uuids = getUuids(4);
    const reqBody = {
      ids: uuids,
      isActive: true,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approverComment: 'Test Approval Comment',
    };

    const res = await request(app)
      .patch('/api/costMonitoring/evaluate')
      .send(reqBody);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Cost monitoring(s) evaluated successfully');
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
          id: { [Op.in]: uuids },
        },
        include: getUserFkIncludes(true),
      }
    );
  });

  it('PUT /toggle should toggle active status', async () => {
    const uuids = getUuids(2);
    const action = 'start';
    const reqBody = {
      ids: uuids,
      action,
    };
    const costMonitoringOne = getCostMonitoring({
      id: uuids[0],
      isActive: false,
    });
    const costMonitoringTwo = getCostMonitoring({
      id: uuids[1],
      isActive: false,
    });

    const expectedResBodies = {
      isActive: true,
      createdAt: expect.stringMatching(ISO_DATE_REGEX),
      updatedAt: expect.stringMatching(ISO_DATE_REGEX),
    };

    CostMonitoring.findAll
      .mockResolvedValueOnce([costMonitoringOne, costMonitoringTwo])
      .mockResolvedValueOnce([
        { ...costMonitoringOne, isActive: true },
        { ...costMonitoringTwo, isActive: true },
      ]);
    const res = await request(app)
      .put('/api/costMonitoring/toggle')
      .send(reqBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Cost monitoring(s) toggled successfully');
    expect(res.body.updatedCostMonitorings).toEqual([
      {
        ...costMonitoringOne,
        ...expectedResBodies,
        lastUpdatedBy: expect.stringMatching(UUID_REGEX),
      },
      {
        ...costMonitoringTwo,
        ...expectedResBodies,
        lastUpdatedBy: expect.stringMatching(UUID_REGEX),
      },
    ]);
    expect(CostMonitoring.findAll).toHaveBeenCalledTimes(2);
    expect(CostMonitoring.update).toHaveBeenCalledTimes(1);
    expect(CostMonitoring.update).toHaveBeenCalledWith(
      { isActive: action === 'start', lastUpdatedBy: AUTHED_USER_ID },
      {
        where: { id: { [Op.in]: uuids } },
        transaction: expect.any(Object),
      }
    );
  });

  it('PUT /toggle should return 404 if no ids found', async () => {
    const uuids = getUuids(4);
    const reqBody = {
      ids: uuids,
      action: 'start',
    };

    CostMonitoring.findAll.mockResolvedValue([]);
    const res = await request(app)
      .put('/api/costMonitoring/toggle')
      .send(reqBody);
    expect(res.status).toBe(404);
    expect(res.text).toBe('Cost monitorings not found');
    expect(CostMonitoring.update).not.toHaveBeenCalled();
  });

  it('DELETE /bulk should bulk delete', async () => {
    const uuids = getUuids(4);
    const reqBody = {
      ids: uuids,
    };
    CostMonitoring.handleDelete.mockResolvedValue(true);

    const res = await request(app)
      .delete('/api/costMonitoring/bulk')
      .send(reqBody);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Cost monitoring(s) deleted successfully');
    expect(CostMonitoring.handleDelete).toHaveBeenCalledWith({
      id: uuids,
      deletedByUserId: AUTHED_USER_ID,
      transaction: expect.any(Object),
    });
  });

  it('PATCH /bulk should bulk update notification emails', async () => {
    const costMonitoringOne = getCostMonitoring();
    const costMonitoringTwo = getCostMonitoring({
      metadata: {
        users: ['testuser'],
        notificationMetaData: {
          notificationCondition: 12,
          primaryContacts: ['testemail2@lexisnexisrisk.com'],
        },
      },
    });

    const reqBody = { costMonitorings: [costMonitoringOne, costMonitoringTwo] };

    const res = await request(app)
      .patch('/api/costMonitoring/bulk')
      .send(reqBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Cost monitorings updated successfully');
    expect(CostMonitoring.update).toHaveBeenCalledTimes(2);
    expect(CostMonitoring.update).toHaveBeenCalledWith(
      { metaData: costMonitoringOne.metaData },
      {
        where: { id: costMonitoringOne.id },
        transaction: expect.any(Object),
      }
    );
    expect(CostMonitoring.update).toHaveBeenCalledWith(
      { metaData: costMonitoringTwo.metaData },
      {
        where: { id: costMonitoringTwo.id },
        transaction: expect.any(Object),
      }
    );
  });

  it('GET /:applicationId should get all cost monitorings for an application', async () => {
    const applicationId = uuidv4();
    const costMonitorings = [
      getCostMonitoring({ applicationId: applicationId }, true),
      getCostMonitoring({ id: uuidv4() }, true),
      getCostMonitoring({ id: uuidv4() }, true),
    ];
    CostMonitoring.findAll.mockResolvedValue(costMonitorings);
    const res = await request(app).get(`/api/costMonitoring/${applicationId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data[0]).toEqual(costMonitorings[0]);
    expect(CostMonitoring.findAll).toHaveBeenCalledTimes(1);
  });

  it('GET /byId/:id should get cost monitoring by ID', async () => {
    const costMonitoring = getCostMonitoring({}, true);
    CostMonitoring.findByPk.mockResolvedValue(costMonitoring);

    const res = await request(app).get(
      `/api/costMonitoring/byId/${costMonitoring.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(costMonitoring);
    expect(CostMonitoring.findByPk).toHaveBeenCalledTimes(1);
  });

  it('GET /byId/:id should 404 if invalid monitoring id', async () => {
    const costMonitoring = getCostMonitoring({}, true);
    CostMonitoring.findByPk.mockResolvedValue(null);

    const res = await request(app).get(
      `/api/costMonitoring/byId/${costMonitoring.id}`
    );
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toEqual('Cost monitoring not found');
    expect(CostMonitoring.findByPk).toHaveBeenCalledTimes(1);
  });

  it('POST / should create a new cost monitoring', async () => {
    const costMonitoring = getCostMonitoring({}, true);
    CostMonitoring.create.mockResolvedValue(costMonitoring);
    CostMonitoring.findByPk.mockResolvedValue(costMonitoring);

    const res = await request(app)
      .post('/api/costMonitoring/')
      .send(costMonitoring);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(costMonitoring);
    expect(CostMonitoring.create).toHaveBeenCalledTimes(1);
  });

  it('PATCH / should update cost monitoring', async () => {
    const costMonitoring = getCostMonitoring({}, true);
    CostMonitoring.update.mockResolvedValue(costMonitoring);

    const res = await request(app)
      .patch('/api/costMonitoring/')
      .send(costMonitoring);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(costMonitoring);
    expect(CostMonitoring.update).toHaveBeenCalledTimes(1);
  });

  it('PATCH / should 404 if ID not found', async () => {
    const costMonitoring = getCostMonitoring({}, true);
    CostMonitoring.update.mockResolvedValue([0]);

    const res = await request(app)
      .patch('/api/costMonitoring/')
      .send(costMonitoring);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toEqual('Cost monitoring not found');
    expect(CostMonitoring.update).toHaveBeenCalledTimes(1);
  });

  it('DELETE / should delete a cost monitoring', async () => {
    const costMonitoringId = uuidv4();
    CostMonitoring.handleDelete.mockResolvedValue(true);
    const res = await request(app).delete(
      `/api/costMonitoring/${costMonitoringId}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toEqual('Cost monitoring deleted successfully');
    expect(CostMonitoring.handleDelete).toHaveBeenCalledWith({
      id: costMonitoringId,
      deletedByUserId: AUTHED_USER_ID,
      transaction: expect.any(Object),
    });
  });

  it('DELETE / should 404 if no rows deleted', async () => {
    const costMonitoringId = uuidv4();
    CostMonitoring.handleDelete.mockResolvedValue(0);

    const res = await request(app).delete(
      `/api/costMonitoring/${costMonitoringId}`
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toEqual('Cost monitoring not found');
    expect(CostMonitoring.handleDelete).toHaveBeenCalledWith({
      id: costMonitoringId,
      deletedByUserId: AUTHED_USER_ID,
      transaction: expect.any(Object),
    });
  });
});
