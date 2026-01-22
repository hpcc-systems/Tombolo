const { monitorCluster } = require('../../jobs/cluster/clusterMonitoring');
const {
  ClusterMonitoring,
  MonitoringType,
  NotificationQueue,
  AsrProduct,
  AsrDomain,
  MonitoringLog,
} = require('../../models');
const { parentPort } = require('worker_threads');
const axios = require('axios');
const { decryptString } = require('@tombolo/shared');
const {
  generateNotificationId,
} = require('../../jobs/jobMonitoring/monitorJobsUtil');

jest.mock('worker_threads');
jest.mock('axios');
jest.mock('@tombolo/shared');
jest.mock('../../jobs/jobMonitoring/monitorJobsUtil');

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  parentPort.postMessage = jest.fn();
  NotificationQueue.create.mockResolvedValue({});
  MonitoringLog.upsert.mockResolvedValue({});
  // Set up ENCRYPTION_KEY for tests
  process.env = {
    ...originalEnv,
    ENCRYPTION_KEY: 'dGVzdEVuY3J5cHRpb25LZXlGb3JUZXN0aW5nMTIzNDU2',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('monitorCluster', () => {
  it('should post error if monitoring type not found', async () => {
    MonitoringType.findOne.mockResolvedValue(null);
    await monitorCluster();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        text: expect.stringContaining(
          'Monitoring type Cluster Monitoring not found'
        ),
      })
    );
  });

  it('should post info and exit if no active monitoring found', async () => {
    MonitoringType.findOne.mockResolvedValue({ id: 1 });
    ClusterMonitoring.findAll.mockResolvedValue([]);
    await monitorCluster();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: expect.stringContaining(
          'No active cluster status monitoring found'
        ),
      })
    );
  });

  it('should post info for found active monitoring', async () => {
    MonitoringType.findOne.mockResolvedValue({ id: 1 });
    ClusterMonitoring.findAll.mockResolvedValue([
      {
        id: 1,
        monitoringName: 'TestMonitoring',
        clusterId: 2,
        metaData: {
          contacts: {
            primaryContacts: ['a'],
            secondaryContacts: ['b'],
            notifyContacts: ['c'],
          },
          asrSpecificMetaData: {},
        },
        clusterMonitoringType: ['status'],
        cluster: {
          id: 2,
          name: 'Cluster2',
          thor_host: 'host',
          thor_port: 'port',
          username: 'user',
          hash: 'hash',
          allowSelfSigned: false,
          timezone_offset: 0,
        },
      },
    ]);
    decryptString.mockReturnValue('decrypted');
    axios.post.mockResolvedValue({
      data: {
        ActivityResponse: {
          ThorClusterList: {
            TargetCluster: [
              { ClusterName: 'Thor1', QueueStatus: 'Active' },
              { ClusterName: 'Thor2', QueueStatus: 'Down' },
            ],
          },
        },
      },
    });
    generateNotificationId.mockReturnValue('notifId');
    await monitorCluster();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: expect.stringContaining(
          'Found 1 active cluster status monitoring'
        ),
      })
    );
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'verbose',
        text: expect.stringContaining('Detected 1 problematic cluster(s)'),
      })
    );
    // In current implementation, notifications are queued in bulk only for usage monitoring.
    // Status monitoring queues notifications but bulk create/upsert happen in a different path.
    // Therefore, we only assert the logs for detection above.
  });

  it('should post error if axios throws', async () => {
    MonitoringType.findOne.mockResolvedValue({ id: 1 });
    ClusterMonitoring.findAll.mockResolvedValue([
      {
        id: 1,
        monitoringName: 'TestMonitoring',
        clusterId: 2,
        metaData: { contacts: {}, asrSpecificMetaData: {} },
        clusterMonitoringType: ['status'],
        cluster: {
          id: 2,
          name: 'Cluster2',
          thor_host: 'host',
          thor_port: 'port',
          username: 'user',
          hash: 'hash',
          allowSelfSigned: false,
          timezone_offset: 0,
        },
      },
    ]);
    decryptString.mockReturnValue('decrypted');
    axios.post.mockRejectedValue(new Error('fail'));
    await monitorCluster();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        text: expect.stringContaining('Error while monitoring cluster status'),
      })
    );
  });

  it('should post warn if ASR product or domain lookup fails', async () => {
    MonitoringType.findOne.mockResolvedValue({ id: 1 });
    ClusterMonitoring.findAll.mockResolvedValue([
      {
        id: 1,
        monitoringName: 'TestMonitoring',
        clusterId: 2,
        metaData: {
          contacts: {},
          asrSpecificMetaData: { domain: 1, productCategory: 1 },
        },
        clusterMonitoringType: ['status'],
        cluster: {
          id: 2,
          name: 'Cluster2',
          thor_host: 'host',
          thor_port: 'port',
          username: 'user',
          hash: 'hash',
          allowSelfSigned: false,
          timezone_offset: 0,
        },
      },
    ]);
    decryptString.mockReturnValue('decrypted');
    axios.post.mockResolvedValue({
      data: {
        ActivityResponse: {
          ThorClusterList: {
            TargetCluster: [{ ClusterName: 'Thor1', QueueStatus: 'Down' }],
          },
        },
      },
    });
    AsrProduct.findOne.mockRejectedValue(new Error('product fail'));
    AsrDomain.findOne.mockRejectedValue(new Error('domain fail'));
    generateNotificationId.mockReturnValue('notifId');
    await monitorCluster();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'warn',
        text: expect.stringContaining(
          'Error while getting ASR product category'
        ),
      })
    );
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'warn',
        text: expect.stringContaining('Error while getting ASR domain'),
      })
    );
  });
});
