const request = require('supertest');
const { app } = require('../test_server');
const { blacklistTokenIntervalId } = require('../../utils/tokenBlackListing');
const { instance_settings: InstanceSettings } = require('../../models');
const { getInstanceSettings } = require('../helpers');

beforeAll(async () => {});

describe('Instance Routes', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    clearInterval(blacklistTokenIntervalId);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('get-instance-settings should get instance settings', async () => {
    const instanceSettings = getInstanceSettings();
    InstanceSettings.findOne.mockResolvedValue(instanceSettings);

    const res = await request(app).get('/api/instance');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(instanceSettings);
    expect(InstanceSettings.findOne).toHaveBeenCalledTimes(1);
  });

  it('get-instance-settings should fail if not found', async () => {
    InstanceSettings.findOne.mockResolvedValue(null);

    const res = await request(app).get('/api/instance');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Instance setting not found');
    expect(InstanceSettings.findOne).toHaveBeenCalledTimes(1);
  });

  it('update-instance-settings should update instance settings', async () => {
    const instanceSettings = getInstanceSettings();
    InstanceSettings.findOne
      .mockReturnValueOnce(instanceSettings)
      .mockReturnValueOnce(instanceSettings);
    InstanceSettings.update.mockResolvedValue([1]);

    const res = await request(app).put('/api/instance');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Instance setting updated successfully');
    expect(res.body.data).toMatchObject(instanceSettings);
    expect(InstanceSettings.findOne).toHaveBeenCalledTimes(2);
    expect(InstanceSettings.update).toHaveBeenCalledTimes(1);
  });

  it('update-instance-settings should error on failed db update', async () => {
    const instanceSettings = getInstanceSettings();
    InstanceSettings.findOne.mockResolvedValue(instanceSettings);
    InstanceSettings.update.mockResolvedValue([0]);

    const res = await request(app).put('/api/instance');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Failed to update instance setting');
    expect(InstanceSettings.findOne).toHaveBeenCalledTimes(1);
    expect(InstanceSettings.update).toHaveBeenCalledTimes(1);
  });
});
