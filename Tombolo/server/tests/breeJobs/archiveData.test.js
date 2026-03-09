import { vi, describe, it, expect, beforeEach } from 'vitest';
import { parentPort } from 'worker_threads';
import { CostMonitoringDataArchiveService } from '../../services/costMonitoringDataArchiveService.js';
import { ArchiveService } from '../../services/archiveService.js';
import { Op } from 'sequelize';

const archiveModelMock = {
  findAll: vi.fn(),
  destroy: vi.fn(),
};
const transactionMock = {
  rollback: vi.fn(),
  commit: vi.fn(),
};
const sequelizeMock = {
  models: {
    CostMonitoringData: {},
  },
  transaction: vi.fn().mockResolvedValue(transactionMock),
  fn: vi.fn(),
  col: vi.fn(),
};

vi.mock('../../utils/archiveUtils', () => ({
  ArchiveManager: function () {
    return {
      getArchiveModel: vi.fn(),
      archiveRecords: vi.fn(),
    };
  },
}));

const getArchiveModelMock = vi.fn().mockResolvedValue(archiveModelMock);
const archiveRecordsMock = vi.fn().mockResolvedValue(42);
const getArchivedDataMock = vi.fn().mockResolvedValue([{ id: 1 }]);
const restoreArchivedDataMock = vi.fn().mockResolvedValue(1);

let service;

describe('CostMonitoringDataArchiveService', () => {
  beforeEach(() => {
    // Clear all mocks first
    vi.clearAllMocks();

    // Then set up prototype mocks with fresh return values
    getArchiveModelMock.mockResolvedValue(archiveModelMock);
    archiveRecordsMock.mockResolvedValue(42);
    getArchivedDataMock.mockResolvedValue([{ id: 1 }]);
    restoreArchivedDataMock.mockResolvedValue(1);

    ArchiveService.prototype.getArchiveModel = getArchiveModelMock;
    ArchiveService.prototype.archiveRecords = archiveRecordsMock;
    ArchiveService.prototype.getArchivedData = getArchivedDataMock;
    ArchiveService.prototype.restoreArchivedData = restoreArchivedDataMock;

    // Set up archive model mock returns
    archiveModelMock.findAll.mockResolvedValue([
      {
        id: 1,
        archivedAt: new Date(),
        applicationId: 'app1',
        toJSON: () => ({ id: 1, applicationId: 'app1' }),
      },
    ]);
    archiveModelMock.destroy.mockResolvedValue(1);

    // Create service instance
    service = new CostMonitoringDataArchiveService(sequelizeMock);
  });

  it('should archive old cost data', async () => {
    const count = await service.archiveOldCostData(30);
    expect(count).toBe(42);
    expect(archiveRecordsMock).toHaveBeenCalledWith(
      'CostMonitoringData',
      expect.any(Object)
    );
  });

  it('should get cost data archive', async () => {
    const data = await service.getCostDataArchive({});
    expect(data).toEqual([{ id: 1 }]);
    expect(getArchivedDataMock).toHaveBeenCalledWith('CostMonitoringData', {});
  });

  it('should restore cost data', async () => {
    const count = await service.restoreCostData([1]);
    expect(count).toBe(1);
    expect(restoreArchivedDataMock).toHaveBeenCalledWith(
      'CostMonitoringData',
      [1]
    );
  });

  it('should get archive stats', async () => {
    const stats = await service.getArchiveStats();
    expect(stats).toHaveProperty('id', 1);
    expect(getArchiveModelMock).toHaveBeenCalledWith('CostMonitoringData');
    expect(archiveModelMock.findAll).toHaveBeenCalled();
  });

  it('should cleanup old archives', async () => {
    const count = await service.cleanupOldArchives(365);
    expect(count).toBe(1);
    expect(getArchiveModelMock).toHaveBeenCalledWith('CostMonitoringData');
    expect(archiveModelMock.destroy).toHaveBeenCalledWith({
      where: { archivedAt: { [Op.lt]: expect.any(Date) } },
    });
  });
});
