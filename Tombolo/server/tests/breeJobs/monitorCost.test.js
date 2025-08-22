const {
  getStartAndEndTime,
  handleMonitorLogs,
  getCostMonitorings,
  monitorCost,
} = require('../../jobs/costMonitoring/monitorCost');

const {
  MonitoringLog,
  CostMonitoring,
  CostMonitoringData,
  Cluster,
  MonitoringType,
} = require('../../models');

const { Workunit } = require('@hpcc-js/comms');
const { getCluster } = require('../../utils/hpcc-util');
const { getClusterOptions } = require('../../utils/getClusterOptions');
const { parentPort } = require('worker_threads');

jest.mock('@hpcc-js/comms');
jest.mock('../../utils/hpcc-util');
jest.mock('../../utils/getClusterOptions');

describe('monitorCost', () => {
  describe('getStartAndEndTime', () => {
    it('should return correct start and end times for first run', () => {
      const result = getStartAndEndTime(null, 0, true);
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('isNewDay');
      expect(typeof result.startTime).toBe('string');
      expect(typeof result.endTime).toBe('string');
    });

    it('should detect new day when lastScanTime is previous day', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const result = getStartAndEndTime(yesterday.toISOString(), 0, true);
      expect(result.isNewDay).toBe(true);
    });

    it('should not detect new day when lastScanTime is today', () => {
      const now = new Date();
      const result = getStartAndEndTime(now.toISOString(), 0, true);
      expect(result.isNewDay).toBe(false);
    });
  });

  describe('handleMonitorLogs', () => {
    it('should create a new MonitoringLog if none exists', async () => {
      MonitoringLog.create.mockResolvedValue({});
      await handleMonitorLogs(null, 1, 2, new Date());
      expect(MonitoringLog.create).toHaveBeenCalledWith({
        cluster_id: 1,
        monitoring_type_id: 2,
        scan_time: expect.any(Date),
        metaData: {},
      });
    });

    it('should update scan_time if MonitoringLog exists', async () => {
      const mockLog = { scan_time: null, save: jest.fn() };
      await handleMonitorLogs(mockLog, 1, 2, new Date());
      expect(mockLog.save).toHaveBeenCalled();
    });

    it('should throw error if MonitoringLog create fails', async () => {
      MonitoringLog.create.mockRejectedValue(new Error('fail'));
      await expect(handleMonitorLogs(null, 1, 2, new Date())).rejects.toThrow(
        'fail'
      );
    });
  });

  describe('getCostMonitorings', () => {
    it('should return active cost monitorings', async () => {
      CostMonitoring.findAll.mockResolvedValue([{ id: 1 }]);
      const result = await getCostMonitorings();
      expect(result).toEqual([{ id: 1 }]);
      expect(CostMonitoring.findAll).toHaveBeenCalledWith({
        attributes: ['id', 'clusterIds', 'applicationId'],
        where: { isActive: true },
      });
    });
  });

  describe('monitorCost', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should post message if no cost monitorings found', async () => {
      CostMonitoring.findAll.mockResolvedValue([]);
      await monitorCost();
      expect(parentPort.postMessage).toHaveBeenCalledWith({
        level: 'info',
        text: 'No cost monitorings found',
      });
    });

    it('should post message if monitoring type not found', async () => {
      CostMonitoring.findAll.mockResolvedValue([{ id: 'some-id' }]);
      MonitoringType.findOne.mockResolvedValue(null);

      await monitorCost();
      expect(parentPort.postMessage).toHaveBeenCalledWith({
        level: 'error',
        text: 'monitorCost: MonitoringType, "Cost Monitoring" not found',
      });
    });

    it('should handle clusters and workunits and trigger analyzeCost', async () => {
      CostMonitoring.findAll.mockResolvedValue([
        { id: 1, clusterIds: [1], applicationId: 123 },
      ]);
      MonitoringType.findOne.mockResolvedValue({
        id: 1,
        name: 'Cost Monitoring',
      });

      Cluster.findAll.mockResolvedValue([{ id: 1 }]);
      getCluster.mockResolvedValue({
        id: 1,
        thor_host: 'host',
        thor_port: 'port',
        username: 'user',
        hash: 'hash',
        timezone_offset: 0,
        allowSelfSigned: false,
      });
      MonitoringLog.findOne.mockResolvedValue(null);
      getClusterOptions.mockReturnValue({});
      Workunit.query.mockResolvedValue([
        {
          State: 'completed',
          Owner: 'user1',
          CompileCost: 1,
          FileAccessCost: 2,
          ExecuteCost: 3,
          Wuid: 'W1',
          Jobname: 'Job1',
        },
      ]);
      CostMonitoringData.create.mockResolvedValue({});
      MonitoringLog.create.mockResolvedValue({});
      await monitorCost();

      expect(CostMonitoringData.create).toHaveBeenCalled();
      expect(MonitoringLog.create).toHaveBeenCalled();
      expect(parentPort.postMessage).toHaveBeenCalledWith({
        level: 'info',
        text: 'Cost Monitor Per user: Monitoring Finished ...',
      });
      expect(parentPort.postMessage).toHaveBeenCalledWith({
        action: 'trigger',
        type: 'monitor-cost',
      });
    });
  });
});
