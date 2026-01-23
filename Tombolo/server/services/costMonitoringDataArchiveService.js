import { ArchiveService } from './archiveService.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class CostMonitoringDataArchiveService extends ArchiveService {
  constructor(sequelize) {
    super(sequelize);
    this.modelName = 'CostMonitoringData';
  }

  async archiveOldCostData(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const archivedCount = await this.archiveRecords(this.modelName, {
        date: { [Op.lt]: cutoffDate },
      });

      logger.info(
        `Archived ${archivedCount} cost monitoring records older than ${daysToKeep} days`
      );
      return archivedCount;
    } catch (error) {
      logger.error('Failed to archive cost monitoring data:', error);
      throw error;
    }
  }

  async getCostDataArchive(filters = {}) {
    return await this.getArchivedData(this.modelName, filters);
  }

  async restoreCostData(archivedRecordIds) {
    try {
      const restoredCount = await this.restoreArchivedData(
        this.modelName,
        archivedRecordIds
      );
      logger.info(`Restored ${restoredCount} cost monitoring records`);
      return restoredCount;
    } catch (error) {
      logger.error('Failed to restore cost monitoring data:', error);
      throw error;
    }
  }

  async getArchiveStats() {
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

    return stats[0];
  }

  async cleanupOldArchives(archiveRetentionDays = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - archiveRetentionDays);

    const ArchiveModel = await this.getArchiveModel(this.modelName);

    const deletedCount = await ArchiveModel.destroy({
      where: {
        archivedAt: { [Op.lt]: cutoffDate },
      },
    });

    logger.info(
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
  async getArchivedDataByCluster(clusterId, additionalFilters = {}) {
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
  async archiveOldCostDataByCluster(clusterId, daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const archivedCount = await this.archiveRecords(this.modelName, {
        clusterId,
        date: { [Op.lt]: cutoffDate },
      });

      logger.info(
        `Archived ${archivedCount} cost monitoring records for cluster ${clusterId} older than ${daysToKeep} days`
      );
      return archivedCount;
    } catch (error) {
      logger.error(
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
  async getArchiveStatsByCluster() {
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

    return stats;
  }
}

export { CostMonitoringDataArchiveService };
