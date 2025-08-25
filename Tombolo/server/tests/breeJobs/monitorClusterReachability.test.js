const {
  monitorClusterReachability,
} = require('../../jobs/cluster/monitorClusterReachability');
const { Cluster, NotificationQueue } = require('../../models');
const { parentPort } = require('worker_threads');
const { AccountService } = require('@hpcc-js/comms');
const { decryptString } = require('../../utils/cipher');
const {
  passwordExpiryAlertDaysForCluster,
} = require('../../config/monitorings');
const {
  passwordExpiryInProximityNotificationPayload,
} = require('../../jobs/cluster/clusterReachabilityMonitoringUtils');

jest.mock('worker_threads');
jest.mock('@hpcc-js/comms');
jest.mock('../../utils/cipher');
jest.mock('../../jobs/cluster/clusterReachabilityMonitoringUtils');
jest.mock('../../config/monitorings');

describe('monitorClusterReachability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should post info when monitoring starts and completes', async () => {
    Cluster.findAll.mockResolvedValue([]);
    parentPort.postMessage = jest.fn();
    await monitorClusterReachability();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: expect.stringContaining(
          'Cluster reachability monitoring started'
        ),
      })
    );
    expect(parentPort.postMessage).toHaveBeenCalledWith(
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
    decryptString.mockReturnValue('decrypted');
    AccountService.mockImplementation(() => ({
      MyAccount: jest.fn().mockResolvedValue({ passwordDaysRemaining: 5 }),
    }));
    passwordExpiryAlertDaysForCluster.includes = jest
      .fn()
      .mockReturnValue(true);
    passwordExpiryInProximityNotificationPayload.mockReturnValue({});
    NotificationQueue.create.mockResolvedValue({});
    Cluster.update.mockResolvedValue({});
    parentPort.postMessage = jest.fn();
    await monitorClusterReachability();
    expect(decryptString).toHaveBeenCalledWith('encrypted');
    expect(NotificationQueue.create).toHaveBeenCalled();
    expect(Cluster.update).toHaveBeenCalled();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
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
    AccountService.mockImplementation(() => ({
      MyAccount: jest.fn().mockResolvedValue({ passwordDaysRemaining: 10 }),
    }));
    passwordExpiryAlertDaysForCluster.includes = jest
      .fn()
      .mockReturnValue(false);
    Cluster.update.mockResolvedValue({});
    parentPort.postMessage = jest.fn();
    await monitorClusterReachability();
    expect(decryptString).not.toHaveBeenCalled();
    expect(Cluster.update).toHaveBeenCalled();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
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
    decryptString.mockReturnValue('decrypted');
    AccountService.mockImplementation(() => ({
      MyAccount: jest.fn().mockResolvedValue({ passwordDaysRemaining: 5 }),
    }));
    passwordExpiryAlertDaysForCluster.includes = jest
      .fn()
      .mockReturnValue(true);
    passwordExpiryInProximityNotificationPayload.mockReturnValue({});
    NotificationQueue.create.mockRejectedValue(new Error('Queue error'));
    Cluster.update.mockResolvedValue({});
    parentPort.postMessage = jest.fn();
    await monitorClusterReachability();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
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
    decryptString.mockReturnValue('decrypted');
    AccountService.mockImplementation(() => ({
      MyAccount: jest.fn().mockRejectedValue(new Error('Unreachable')),
    }));
    Cluster.update.mockResolvedValue({});
    parentPort.postMessage = jest.fn();
    await monitorClusterReachability();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        text: expect.stringContaining('is not reachable'),
      })
    );
    expect(Cluster.update).toHaveBeenCalled();
  });

  it('should handle top-level error', async () => {
    Cluster.findAll.mockRejectedValue(new Error('Top level error'));
    parentPort.postMessage = jest.fn();
    await monitorClusterReachability();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        text: expect.stringContaining('monitoring failed'),
      })
    );
  });
});
