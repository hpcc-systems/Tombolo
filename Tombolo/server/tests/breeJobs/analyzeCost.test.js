const {
  buildCMIdempotencyKey,
  createCMNotificationPayload,
  getClusters,
  getAsrData,
  emailAlreadySent,
  analyzeClusterCost,
  analyzeUserCost,
  analyzeCost,
} = require('../../jobs/costMonitoring/analyzeCost');

const {
  Integration,
  Cluster,
  CostMonitoring,
  CostMonitoringData,
  AsrDomain,
  AsrProduct,
  SentNotification,
  NotificationQueue,
  MonitoringType,
} = require('../../models');
const {
  findLocalDateTimeAtCluster,
} = require('../../jobs/jobMonitoring/monitorJobsUtil');
const { getCostMonitoring } = require('../helpers');
const { parentPort } = require('worker_threads');

describe('analyzeCost.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildCMIdempotencyKey', () => {
    it('should build idempotency key with correct format', () => {
      const costMonitoring = getCostMonitoring();
      const totalCost = 123.45;
      const key = buildCMIdempotencyKey({ costMonitoring, totalCost });

      const threshold =
        costMonitoring.metaData.notificationMetaData.notificationCondition;
      const thresholdSignature = `sum:${costMonitoring.isSummed}:gte:${threshold}`;
      const usersSignature = costMonitoring.metaData.users?.join(',') ?? '';
      const dayBucket = new Date().toISOString().split('T')[0];

      expect(key).toBe(
        `CM|${costMonitoring.applicationId}|${costMonitoring.id}|${costMonitoring.monitoringScope}|${costMonitoring.clusterIds?.join(',') ?? ''}|${dayBucket}|${usersSignature}|${thresholdSignature}|total:${totalCost.toFixed(2)}`
      );
    });
  });

  describe('createCMNotificationPayload', () => {
    it('should create notification payload for clusters scope', () => {
      const input = {
        monitoringType: { id: 1 },
        costMonitoring: {
          id: 'some-id',
          applicationId: 'another-id',
          monitoringScope: 'clusters',
          monitoringName: 'Test',
          metaData: { notificationMetaData: { notificationCondition: 100 } },
        },
        threshold: 100,
        summedCost: 200,
        erroringClusters: [
          {
            totalCost: 200,
            fileAccessCost: 10,
            executeCost: 20,
            compileCost: 30,
            clusterName: 'ClusterA',
            timezone_offset: 0,
          },
        ],
        primaryContacts: ['a'],
        secondaryContacts: ['b'],
        notifyContacts: ['c'],
        asrSpecificMetaData: {},
        idempotencyKey: 'key',
      };
      const payload = createCMNotificationPayload(input);
      expect(payload.metaData.issue).toEqual({
        Issue: `Cost threshold of ${input.threshold} passed`,
        'Total Summed Cost': input.summedCost,
        clusters: input.erroringClusters.map(cluster => {
          return {
            totalCost: cluster.totalCost,
            fileAccessCost: cluster.fileAccessCost,
            executeCost: cluster.executeCost,
            compileCost: cluster.compileCost,
            clusterName: cluster.clusterName,
            'Discovered At': findLocalDateTimeAtCluster(
              cluster.timezone_offset
            ).toLocaleString(),
          };
        }),
      });
    });

    it('should throw error for invalid scope', () => {
      expect(() =>
        createCMNotificationPayload({
          costMonitoring: { monitoringScope: 'invalid' },
        })
      ).toThrow('Invalid monitoring scope');
    });
  });

  describe('getClusters', () => {
    it('should fetch clusters and cache them', async () => {
      Cluster.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const clusters = await getClusters([1, 2]);
      expect(clusters).toEqual([{ id: 1 }, { id: 2 }]);
      const clusterFromCache = await getClusters([1]);
      expect(Cluster.findAll).toHaveBeenCalledTimes(1);
      expect(clusterFromCache).toEqual([{ id: 1 }]);
    });
  });

  describe('getAsrData', () => {
    it('should return contacts and asr metaData', async () => {
      const spyBuildNotifId = jest
        .spyOn(
          require('../../jobs/jobMonitoring/monitorJobsUtil'),
          'generateNotificationId'
        )
        .mockImplementation(() => 'notifId');

      Integration.findOne.mockResolvedValue({});
      AsrProduct.findByPk.mockResolvedValue({
        shortCode: 'SC',
        name: 'Prod',
        tier: 'T1',
      });
      AsrDomain.findByPk.mockResolvedValue({
        name: 'Dom',
        region: 'R',
        severity: 1,
      });
      const costMonitoring = {
        metaData: {
          asrSpecificMetaData: { domain: 1, productCategory: 2 },
          notificationMetaData: {
            primaryContacts: ['a'],
            secondaryContacts: ['b'],
            notifyContacts: ['c'],
          },
        },
      };
      const result = await getAsrData(costMonitoring);
      expect(result.primaryContacts).toEqual(['a']);
      expect(result.asrSpecificMetaData.productShortCode).toBe('SC');
      spyBuildNotifId.mockRestore();
    });
  });

  describe('emailAlreadySent', () => {
    it('should return true if notification exists', async () => {
      SentNotification.findOne.mockResolvedValue({ id: 1 });
      const alreadySent = await emailAlreadySent('key');
      expect(alreadySent).toBe(true);
      expect(SentNotification.findOne).toHaveBeenCalledWith({
        where: { idempotencyKey: 'key' },
      });
    });

    it('should return false if notification does not exist', async () => {
      SentNotification.findOne.mockResolvedValue(null);
      const result = await emailAlreadySent('key');
      expect(result).toBe(false);
    });
  });

  describe('analyzeClusterCost', () => {
    it('should not send notification if no aggregatedCostsByCluster', async () => {
      const costMonitoring = {
        id: 1,
        metaData: { notificationMetaData: { notificationCondition: 100 } },
        isSummed: true,
      };
      const monitoringType = { id: 1 };
      const clusterCostTotals = { aggregatedCostsByCluster: null };
      await analyzeClusterCost(
        clusterCostTotals,
        costMonitoring,
        monitoringType
      );

      expect(NotificationQueue.create).not.toHaveBeenCalled();
    });

    it('should send notification if summedCost >= threshold', async () => {
      const spyBuildKey = jest
        .spyOn(
          require('../../jobs/jobMonitoring/monitorJobsUtil'),
          'generateNotificationIdempotencyKey'
        )
        .mockImplementation(() => 'key');
      const spyBuildPayload = jest
        .spyOn(
          require('../../jobs/jobMonitoring/monitorJobsUtil'),
          'createNotificationPayload'
        )
        .mockImplementation(() => {});

      SentNotification.findOne.mockResolvedValue(null);
      NotificationQueue.create.mockResolvedValue({});
      const costMonitoring = {
        id: 1,
        metaData: { notificationMetaData: { notificationCondition: 100 } },
        monitoringScope: 'clusters',
        isSummed: true,
      };
      const monitoringType = { id: 1 };
      const clusterCostTotals = {
        aggregatedCostsByCluster: { 1: { totalCost: 200 } },
        overallTotalCost: 200,
      };
      await analyzeClusterCost(
        clusterCostTotals,
        costMonitoring,
        monitoringType
      );
      expect(NotificationQueue.create).toHaveBeenCalled();
      spyBuildKey.mockRestore();
      spyBuildPayload.mockRestore();
    });
  });

  describe('analyzeUserCost', () => {
    it('should not send notification if summedCost < threshold', async () => {
      const costMonitoring = {
        id: 1,
        monitoringScope: 'users',
        metaData: {
          notificationMetaData: { notificationCondition: 100 },
          users: ['*'],
        },
        isSummed: true,
        clusterIds: [1],
      };
      const monitoringType = { id: 1 };
      const userCostTotals = [{ username: 'u1', totalCost: 50 }];
      await analyzeUserCost(userCostTotals, costMonitoring, monitoringType);
      // Should not call NotificationQueue.create
    });
    it('should send notification if summedCost >= threshold', async () => {
      const spyBuildKey = jest
        .spyOn(
          require('../../jobs/jobMonitoring/monitorJobsUtil'),
          'generateNotificationIdempotencyKey'
        )
        .mockImplementation(() => 'key');
      const spyBuildPayload = jest
        .spyOn(
          require('../../jobs/jobMonitoring/monitorJobsUtil'),
          'createNotificationPayload'
        )
        .mockImplementation(() => {});

      const spyBuildNotifId = jest
        .spyOn(
          require('../../jobs/jobMonitoring/monitorJobsUtil'),
          'generateNotificationId'
        )
        .mockImplementation(() => 'notifId');

      SentNotification.findOne.mockResolvedValue(null);
      NotificationQueue.create.mockResolvedValue({});
      Integration.findOne.mockResolvedValue({});
      AsrProduct.findByPk.mockResolvedValue({
        shortCode: 'SC',
        name: 'Prod',
        tier: 'T1',
      });
      AsrDomain.findByPk.mockResolvedValue({
        name: 'Dom',
        region: 'R',
        severity: 1,
      });
      Cluster.findAll.mockResolvedValue([{ id: 1, timezone_offset: 0 }]);
      const costMonitoring = {
        id: 1,
        monitoringScope: 'users',
        metaData: {
          notificationMetaData: { notificationCondition: 100 },
          users: ['*'],
          asrSpecificMetaData: { domain: 1, productCategory: 2 },
        },
        isSummed: true,
        clusterIds: [1],
      };
      const monitoringType = { id: 1 };
      const userCostTotals = [{ username: 'u1', totalCost: 150 }];
      await analyzeUserCost(userCostTotals, costMonitoring, monitoringType);
      expect(NotificationQueue.create).toHaveBeenCalled();

      spyBuildPayload.mockRestore();
      spyBuildKey.mockRestore();
      spyBuildNotifId.mockRestore();
    });
  });

  describe('analyzeCost', () => {
    it('should handle clusters and users monitoringScope', async () => {
      MonitoringType.findOne.mockResolvedValue({ id: 1 });
      CostMonitoring.findAll.mockResolvedValue([
        { id: 1, monitoringScope: 'clusters' },
        { id: 2, monitoringScope: 'users' },
      ]);
      CostMonitoringData.getClusterDataTotals.mockResolvedValue({
        aggregatedCostsByCluster: null,
      });
      CostMonitoringData.getDataTotals.mockResolvedValue([]);
      await analyzeCost();
      expect(MonitoringType.findOne).toHaveBeenCalled();
      expect(CostMonitoring.findAll).toHaveBeenCalled();
    });

    it('should post error for invalid scope', async () => {
      MonitoringType.findOne.mockResolvedValue({ id: 1 });
      const costMonitoring = { id: 3, monitoringScope: 'invalid' };
      CostMonitoring.findAll.mockResolvedValue([costMonitoring]);
      await analyzeCost();
      expect(parentPort.postMessage).toHaveBeenCalledWith({
        level: 'error',
        text: `Invalid monitoring scope (${costMonitoring.monitoringScope}) for analyzeCost: ${costMonitoring.id}`,
      });
    });
  });
});
