const { ArchiveService } = require('./archiveService');
const { Op } = require('sequelize');
const logger = require('../config/logger');

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
        analyzed: true,
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
            this.sequelize.fn('DISTINCT', this.sequelize.col('applicationId'))
          ),
          'uniqueApplications',
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
}

module.exports = {
  CostMonitoringDataArchiveService,
};
