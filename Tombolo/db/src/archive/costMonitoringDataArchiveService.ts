import { ArchiveService } from './archiveService.js';
import { Op, Sequelize, Model, type WhereOptions } from 'sequelize';
import type { Logger } from '@tombolo/shared/backend';
import { logger as defaultLogger } from '@tombolo/shared/backend';

interface CostArchiveStats {
  totalRecords: number;
  oldestArchive: Date | null;
  latestArchive: Date | null;
  uniqueClusters: number;
}

interface CostArchiveStatsByCluster {
  clusterId: string;
  recordCount: number;
  oldestRecord: Date | null;
  newestRecord: Date | null;
  firstArchivedAt: Date | null;
  lastArchivedAt: Date | null;
}

interface CostArchiveStatsRaw {
  totalRecords: string | number;
  oldestArchive: Date | null;
  latestArchive: Date | null;
  uniqueClusters: string | number;
}

interface CostArchiveStatsByClusterRaw {
  clusterId: string;
  recordCount: string | number;
  oldestRecord: Date | null;
  newestRecord: Date | null;
  firstArchivedAt: Date | null;
  lastArchivedAt: Date | null;
}

class CostMonitoringDataArchiveService extends ArchiveService {
  private modelName: string;
  private logger: Logger;

  constructor(sequelize: Sequelize, logger: Logger = defaultLogger) {
    super(sequelize);
    this.modelName = 'CostMonitoringData';
    this.logger = logger;
  }

  async archiveOldCostData(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const archivedCount = await this.archiveRecords(
        this.modelName,
        {
          date: { [Op.lt]: cutoffDate },
        },
        {},
        { forceDelete: true }
      );

      this.logger.info(
        `Archived ${archivedCount} cost monitoring records older than ${daysToKeep} days`
      );
      return archivedCount;
    } catch (error) {
      this.logger.error('Failed to archive cost monitoring data:', error);
      throw error;
    }
  }

  async getCostDataArchive(filters: WhereOptions = {}): Promise<Model[]> {
    return await this.getArchivedData(this.modelName, filters);
  }

  async getArchiveStats(): Promise<CostArchiveStats> {
    const ArchiveModel = await this.getArchiveModel(this.modelName);

    const stats = await ArchiveModel.findAll({
      attributes: [
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'totalRecords'],
        [
          this.sequelize.fn('MIN', this.sequelize.col('archivedAt')),
          'oldestArchive',
        ],
        [
          this.sequelize.fn('MAX', this.sequelize.col('archivedAt')),
          'latestArchive',
        ],
        [
          this.sequelize.fn(
            'COUNT',
            this.sequelize.fn('DISTINCT', this.sequelize.col('clusterId'))
          ),
          'uniqueClusters',
        ],
      ],
      raw: true,
    });

    const raw = stats[0] as unknown as CostArchiveStatsRaw;
    return {
      totalRecords: Number(raw?.totalRecords ?? 0),
      oldestArchive: raw?.oldestArchive ?? null,
      latestArchive: raw?.latestArchive ?? null,
      uniqueClusters: Number(raw?.uniqueClusters ?? 0),
    };
  }

  async cleanupOldArchives(
    archiveRetentionDays: number = 365
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - archiveRetentionDays);

    const ArchiveModel = await this.getArchiveModel(this.modelName);

    const deletedCount = await ArchiveModel.destroy({
      where: {
        archivedAt: { [Op.lt]: cutoffDate },
      },
      force: true,
    });

    this.logger.info(
      `Cleaned up ${deletedCount} archived records older than ${archiveRetentionDays} days`
    );
    return deletedCount;
  }

  /**
   * Get archived cost data for a specific cluster
   * @param {string} clusterId - UUID of the cluster
   * @param {Object} additionalFilters - Additional filter criteria
   * @returns {Promise<Array>} Archived records for the cluster
   */
  async getArchivedDataByCluster(
    clusterId: string,
    additionalFilters: WhereOptions = {}
  ): Promise<Model[]> {
    return await this.getCostDataArchive({
      clusterId,
      ...additionalFilters,
    });
  }

  /**
   * Archive cost data for a specific cluster older than the specified days
   * @param {string} clusterId - UUID of the cluster
   * @param {number} daysToKeep - Number of days to keep before archiving
   * @returns {Promise<number>} Number of records archived
   */
  async archiveOldCostDataByCluster(
    clusterId: string,
    daysToKeep: number = 30
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const archivedCount = await this.archiveRecords(
        this.modelName,
        {
          clusterId,
          date: { [Op.lt]: cutoffDate },
        },
        {},
        { forceDelete: true }
      );

      this.logger.info(
        `Archived ${archivedCount} cost monitoring records for cluster ${clusterId} older than ${daysToKeep} days`
      );
      return archivedCount;
    } catch (error) {
      this.logger.error(
        `Failed to archive cost monitoring data for cluster ${clusterId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get archive statistics grouped by cluster
   * @returns {Promise<Array>} Statistics per cluster including record counts and date ranges
   */
  async getArchiveStatsByCluster(): Promise<CostArchiveStatsByCluster[]> {
    const ArchiveModel = await this.getArchiveModel(this.modelName);

    const stats = await ArchiveModel.findAll({
      attributes: [
        'clusterId',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'recordCount'],
        [this.sequelize.fn('MIN', this.sequelize.col('date')), 'oldestRecord'],
        [this.sequelize.fn('MAX', this.sequelize.col('date')), 'newestRecord'],
        [
          this.sequelize.fn('MIN', this.sequelize.col('archivedAt')),
          'firstArchivedAt',
        ],
        [
          this.sequelize.fn('MAX', this.sequelize.col('archivedAt')),
          'lastArchivedAt',
        ],
      ],
      group: ['clusterId'],
      raw: true,
    });

    return (stats as unknown as CostArchiveStatsByClusterRaw[]).map(row => ({
      clusterId: row.clusterId,
      recordCount: Number(row.recordCount ?? 0),
      oldestRecord: row.oldestRecord ?? null,
      newestRecord: row.newestRecord ?? null,
      firstArchivedAt: row.firstArchivedAt ?? null,
      lastArchivedAt: row.lastArchivedAt ?? null,
    }));
  }
}

export { CostMonitoringDataArchiveService };
