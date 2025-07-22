const { ArchiveManager } = require('../utils/archiveUtils');
const { Op } = require('sequelize');

class ArchiveService {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.archiveManager = new ArchiveManager(sequelize);
  }

  async getArchiveModel(originalModelName) {
    const originalModel = this.sequelize.models[originalModelName];
    if (!originalModel) {
      throw new Error(`Original model ${originalModelName} not found`);
    }
    return this.archiveManager.getArchiveModel(originalModel);
  }

  async archiveRecords(originalModelName, whereClause, archiveMetadata = {}) {
    const originalModel = this.sequelize.models[originalModelName];
    if (!originalModel) {
      throw new Error(`Original model ${originalModelName} not found`);
    }

    return await this.archiveManager.archiveRecords(
      originalModel,
      whereClause,
      archiveMetadata
    );
  }

  async getArchivedData(originalModelName, filters = {}) {
    const ArchiveModel = await this.getArchiveModel(originalModelName);
    return await ArchiveModel.findAll({
      where: filters,
      order: [['archivedAt', 'DESC']],
    });
  }

  async restoreArchivedData(originalModelName, archivedRecordIds) {
    const ArchiveModel = await this.getArchiveModel(originalModelName);
    const originalModel = this.sequelize.models[originalModelName];

    const transaction = await this.sequelize.transaction();
    try {
      const archivedRecords = await ArchiveModel.findAll({
        where: { id: { [Op.in]: archivedRecordIds } },
        transaction,
      });

      if (archivedRecords.length === 0) {
        await transaction.rollback();
        return 0;
      }

      const restoreData = archivedRecords.map(record => {
        const data = record.toJSON();
        delete data.archivedAt;
        return data;
      });

      await originalModel.bulkCreate(restoreData, { transaction });

      await ArchiveModel.destroy({
        where: { id: { [Op.in]: archivedRecordIds } },
        transaction,
      });

      await transaction.commit();
      return archivedRecords.length;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = { ArchiveService };
