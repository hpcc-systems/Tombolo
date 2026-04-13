import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { app } from '../test_server.js';
import { mockedModels } from '../mockedModels.js';

vi.mock('axios');

describe('Integrations Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JOBS_SERVICE_URL = 'http://jobs.test:8678';
    process.env.JOBS_API_KEY = 'test-key';
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
  });

  afterEach(() => {
    delete process.env.JOBS_SERVICE_URL;
    delete process.env.JOBS_API_KEY;
  });

  it('queues HPCC tools manual sync when mapping exists', async () => {
    const mappingId = uuidv4();

    mockedModels.IntegrationMapping.findOne.mockResolvedValue({
      id: mappingId,
    });
    vi.mocked(axios.post).mockResolvedValue({
      data: { success: true, queue: 'hpcc-tools', jobId: 'job-123' },
    } as never);

    const res = await request(app).post(
      `/api/integrations/hpccTools/manualSync/${mappingId}`
    );

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('HPCC Tools sync job queued');
    expect(axios.post).toHaveBeenCalledWith(
      'http://jobs.test:8678/queue/hpcc-tools/sync',
      expect.objectContaining({
        integrationMappingId: mappingId,
        trigger: 'manual',
      }),
      expect.objectContaining({
        headers: { 'x-api-key': 'test-key' },
      })
    );
  });

  it('returns 404 when HPCC tools mapping is missing', async () => {
    const mappingId = uuidv4();

    mockedModels.IntegrationMapping.findOne.mockResolvedValue(null);

    const res = await request(app).post(
      `/api/integrations/hpccTools/manualSync/${mappingId}`
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('returns 502 when jobs service rejects authorization', async () => {
    const mappingId = uuidv4();

    mockedModels.IntegrationMapping.findOne.mockResolvedValue({
      id: mappingId,
    });
    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    vi.mocked(axios.post).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 401,
      },
    });

    const res = await request(app).post(
      `/api/integrations/hpccTools/manualSync/${mappingId}`
    );

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Jobs service authorization failed');
  });
});
