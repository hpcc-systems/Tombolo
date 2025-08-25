const { parentPort } = require('worker_threads');
const {
  CostMonitoringDataArchiveService,
} = require('../../services/costMonitoringDataArchiveService');
const { Op } = require('sequelize');

const archiveModelMock = {
  findAll: jest.fn(),
  destroy: jest.fn(),
};
const transactionMock = {
  rollback: jest.fn(),
  commit: jest.fn(),
};
const sequelizeMock = {
  models: {
    CostMonitoringData: {},
  },
  transaction: jest.fn().mockResolvedValue(transactionMock),
  fn: jest.fn(),
  col: jest.fn(),
};

jest.mock('../../utils/archiveUtils', () => ({
  ArchiveManager: function () {
    return {
      getArchiveModel: jest.fn(),
      archiveRecords: jest.fn(),
    };
  },
}));

const ArchiveService = require('../../services/archiveService').ArchiveService;
ArchiveService.prototype.getArchiveModel = jest
  .fn()
  .mockResolvedValue(archiveModelMock);
ArchiveService.prototype.archiveRecords = jest.fn().mockResolvedValue(42);
ArchiveService.prototype.getArchivedData = jest
  .fn()
  .mockResolvedValue([{ id: 1 }]);
ArchiveService.prototype.restoreArchivedData = jest.fn().mockResolvedValue(1);
archiveModelMock.findAll.mockResolvedValue([
  {
    id: 1,
    archivedAt: new Date(),
    applicationId: 'app1',
    toJSON: () => ({ id: 1, applicationId: 'app1' }),
  },
]);
archiveModelMock.destroy.mockResolvedValue(1);

const service = new CostMonitoringDataArchiveService(sequelizeMock);

describe('CostMonitoringDataArchiveService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    parentPort.postMessage = jest.fn();
  });

  it('should archive old cost data', async () => {
    const count = await service.archiveOldCostData(30);
    expect(count).toBe(42);
    expect(ArchiveService.prototype.archiveRecords).toHaveBeenCalledWith(
      'CostMonitoringData',
      expect.any(Object)
    );
  });

  it('should get cost data archive', async () => {
    const data = await service.getCostDataArchive({});
    expect(data).toEqual([{ id: 1 }]);
    expect(ArchiveService.prototype.getArchivedData).toHaveBeenCalledWith(
      'CostMonitoringData',
      {}
    );
  });

  it('should restore cost data', async () => {
    const count = await service.restoreCostData([1]);
    expect(count).toBe(1);
    expect(ArchiveService.prototype.restoreArchivedData).toHaveBeenCalledWith(
      'CostMonitoringData',
      [1]
    );
  });

  it('should get archive stats', async () => {
    const stats = await service.getArchiveStats();
    expect(stats).toHaveProperty('id', 1);
    expect(ArchiveService.prototype.getArchiveModel).toHaveBeenCalledWith(
      'CostMonitoringData'
    );
    expect(archiveModelMock.findAll).toHaveBeenCalled();
  });

  it('should cleanup old archives', async () => {
    const count = await service.cleanupOldArchives(365);
    expect(count).toBe(1);
    expect(ArchiveService.prototype.getArchiveModel).toHaveBeenCalledWith(
      'CostMonitoringData'
    );
    expect(archiveModelMock.destroy).toHaveBeenCalledWith({
      where: { archivedAt: { [Op.lt]: expect.any(Date) } },
    });
  });
});
