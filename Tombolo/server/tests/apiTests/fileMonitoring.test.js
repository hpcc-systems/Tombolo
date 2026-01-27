import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
} from 'vitest';
import request from 'supertest';
import { app } from '../test_server.js';
import { FileMonitoring, sequelize } from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import { blacklistTokenIntervalId } from '../../utils/tokenBlackListing.js';
import { AUTHED_USER_ID } from '../helpers.js';
import { APPROVAL_STATUS } from '../../config/constants.js';

beforeAll(async () => {
  const consoleModule = await import('console');
  global.console = consoleModule.default; // restore native console
});

vi.mock('../../models/index.js', () => {
  const actual = vi.importActual('../../models/index.js');
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
  beforeEach(() => {
    vi.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('POST /api/fileMonitoring should create a new file monitoring', async () => {
    const payload = getFileMonitoringPayload();
    FileMonitoring.create.mockResolvedValue(payload);
    FileMonitoring.findByPk.mockResolvedValue(payload);

    const res = await request(app).post('/api/fileMonitoring').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(payload);
  });

  it('GET /api/fileMonitoring/:id should get file monitoring by id', async () => {
    const payload = getFileMonitoringPayload();
    FileMonitoring.findByPk.mockResolvedValue(payload);

    const res = await request(app).get(`/api/fileMonitoring/${payload.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(payload);
  });

  it('PUT /api/fileMonitoring/:id should update file monitoring', async () => {
    const payload = getFileMonitoringPayload();
    FileMonitoring.update.mockResolvedValue([1]);
    FileMonitoring.findByPk.mockResolvedValue(payload);

    const res = await request(app)
      .put(`/api/fileMonitoring/${payload.id}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(payload);
  });

  it('GET /api/fileMonitoring/all/:applicationId should get all file monitorings for an application', async () => {
    const payload = getFileMonitoringPayload();
    FileMonitoring.findAll.mockResolvedValue([payload]);

    const res = await request(app).get(
      `/api/fileMonitoring/all/${payload.applicationId}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('PATCH /api/fileMonitoring/evaluate should evaluate file monitoring', async () => {
    FileMonitoring.findAll.mockResolvedValue([getFileMonitoringPayload()]);
    FileMonitoring.update.mockResolvedValue([1]);

    const res = await request(app)
      .patch('/api/fileMonitoring/evaluate')
      .send({
        ids: [uuidv4()],
        approvalStatus: APPROVAL_STATUS.APPROVED,
        approverComment: 'Looks good',
        approvedBy: AUTHED_USER_ID,
        isActive: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PATCH /api/fileMonitoring/toggle should toggle file monitoring active status', async () => {
    FileMonitoring.findAll.mockResolvedValue([getFileMonitoringPayload()]);
    FileMonitoring.update.mockResolvedValue([1]);

    const res = await request(app)
      .patch('/api/fileMonitoring/toggle')
      .send({ ids: [uuidv4()], isActive: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/fileMonitoring should delete file monitoring', async () => {
    const commit = vi.fn();
    const rollback = vi.fn();
    jest
      .spyOn(sequelize, 'transaction')
      .mockResolvedValue({ commit, rollback });

    FileMonitoring.update = vi.fn().mockResolvedValue([1]);
    FileMonitoring.destroy = vi.fn().mockResolvedValue(1);

    const res = await request(app)
      .delete('/api/fileMonitoring')
      .send({ ids: [uuidv4()] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(FileMonitoring.update).toHaveBeenCalled();
    expect(FileMonitoring.destroy).toHaveBeenCalled();
    expect(commit).toHaveBeenCalled();
  });
});
