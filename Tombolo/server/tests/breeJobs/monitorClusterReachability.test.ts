import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { monitorClusterReachability } from '../../jobs/cluster/monitorClusterReachability.js';
import { mockedModels } from '../mockedModels.js';
const { Cluster, NotificationQueue } = mockedModels;
import { parentPort } from 'worker_threads';
import { AccountService } from '@hpcc-js/comms';
import { decryptString } from '@tombolo/shared';
import { passwordExpiryAlertDaysForCluster } from '../../config/monitorings.js';
import { passwordExpiryInProximityNotificationPayload } from '../../jobs/cluster/clusterReachabilityMonitoringUtils.js';

const mockedDecryptString = decryptString as unknown as ReturnType<
  typeof vi.fn
>;
const mockedAccountService = AccountService as unknown as ReturnType<
  typeof vi.fn
>;
const mockedPasswordExpiryPayload =
  passwordExpiryInProximityNotificationPayload as unknown as ReturnType<
    typeof vi.fn
  >;
const workerParentPort = parentPort as NonNullable<typeof parentPort>;

vi.mock('@hpcc-js/comms');
vi.mock('@tombolo/shared');
vi.mock('../../jobs/cluster/clusterReachabilityMonitoringUtils.js');
vi.mock('../../config/monitorings.js');

describe('monitorClusterReachability', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up ENCRYPTION_KEY for tests
    process.env = {
      ...originalEnv,
      ENCRYPTION_KEY: 'dGVzdEVuY3J5cHRpb25LZXlGb3JUZXN0aW5nMTIzNDU2',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should post info when monitoring starts and completes', async () => {
    Cluster.findAll.mockResolvedValue([]);
    vi.clearAllMocks();
    await monitorClusterReachability();
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: expect.stringContaining(
          'Cluster reachability monitoring started'
        ),
      })
    );
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: expect.stringContaining('monitoring completed'),
      })
    );
  });

  it('should handle cluster with password and reachability', async () => {
    Cluster.findAll.mockResolvedValue([
      {
        id: 1,
        hash: 'encrypted',
        thor_host: 'host',
        thor_port: 'port',
        username: 'user',
        allowSelfSigned: false,
        accountMetaData: {},
        name: 'Cluster1',
        adminEmails: ['admin@test.com'],
        metaData: {},
      },
    ]);
    mockedDecryptString.mockReturnValue('decrypted');
    mockedAccountService.mockImplementation(function () {
      return {
        MyAccount: vi.fn().mockResolvedValue({ passwordDaysRemaining: 5 }),
      };
    });
    passwordExpiryAlertDaysForCluster.includes = vi.fn().mockReturnValue(true);
    mockedPasswordExpiryPayload.mockReturnValue({});
    NotificationQueue.create.mockResolvedValue({});
    Cluster.update.mockResolvedValue({});
    vi.clearAllMocks();
    await monitorClusterReachability();
    expect(mockedDecryptString).toHaveBeenCalledWith(
      'encrypted',
      expect.any(String)
    );
    expect(NotificationQueue.create).toHaveBeenCalled();
    expect(Cluster.update).toHaveBeenCalled();
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: expect.stringContaining('is reachable'),
      })
    );
  });

  it('should handle cluster with no password', async () => {
    Cluster.findAll.mockResolvedValue([
      {
        id: 2,
        hash: null,
        thor_host: 'host',
        thor_port: 'port',
        username: 'user',
        allowSelfSigned: false,
        accountMetaData: {},
        name: 'Cluster2',
        adminEmails: ['admin@test.com'],
        metaData: {},
      },
    ]);
    mockedAccountService.mockImplementation(function () {
      return {
        MyAccount: vi.fn().mockResolvedValue({ passwordDaysRemaining: 10 }),
      };
    });
    passwordExpiryAlertDaysForCluster.includes = vi.fn().mockReturnValue(false);
    Cluster.update.mockResolvedValue({});
    vi.clearAllMocks();
    await monitorClusterReachability();
    expect(mockedDecryptString).not.toHaveBeenCalled();
    expect(Cluster.update).toHaveBeenCalled();
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: expect.stringContaining('is reachable'),
      })
    );
  });

  it('should handle notification queue error gracefully', async () => {
    Cluster.findAll.mockResolvedValue([
      {
        id: 3,
        hash: 'encrypted',
        thor_host: 'host',
        thor_port: 'port',
        username: 'user',
        allowSelfSigned: false,
        accountMetaData: {},
        name: 'Cluster3',
        adminEmails: ['admin@test.com'],
        metaData: {},
      },
    ]);
    mockedDecryptString.mockReturnValue('decrypted');
    mockedAccountService.mockImplementation(function () {
      return {
        MyAccount: vi.fn().mockResolvedValue({ passwordDaysRemaining: 5 }),
      };
    });
    passwordExpiryAlertDaysForCluster.includes = vi.fn().mockReturnValue(true);
    mockedPasswordExpiryPayload.mockReturnValue({});
    NotificationQueue.create.mockRejectedValue(new Error('Queue error'));
    Cluster.update.mockResolvedValue({});
    vi.clearAllMocks();
    await monitorClusterReachability();
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        text: expect.stringContaining('failed to queue notification'),
      })
    );
  });

  it('should handle unreachable cluster', async () => {
    Cluster.findAll.mockResolvedValue([
      {
        id: 4,
        hash: 'encrypted',
        thor_host: 'host',
        thor_port: 'port',
        username: 'user',
        allowSelfSigned: false,
        accountMetaData: {},
        name: 'Cluster4',
        adminEmails: ['admin@test.com'],
        metaData: {},
      },
    ]);
    mockedDecryptString.mockReturnValue('decrypted');
    mockedAccountService.mockImplementation(function () {
      return {
        MyAccount: vi.fn().mockRejectedValue(new Error('Unreachable')),
      };
    });
    Cluster.update.mockResolvedValue({});
    vi.clearAllMocks();
    await monitorClusterReachability();
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        text: expect.stringContaining('is not reachable'),
      })
    );
    expect(Cluster.update).toHaveBeenCalled();
  });

  it('should handle top-level error', async () => {
    Cluster.findAll.mockRejectedValue(new Error('Top level error'));
    vi.clearAllMocks();
    await monitorClusterReachability();
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        text: expect.stringContaining('monitoring failed'),
      })
    );
  });
});
