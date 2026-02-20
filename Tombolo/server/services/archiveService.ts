import { ArchiveManager } from '../utils/archiveUtils.js';
import { Op, Sequelize, ModelStatic, Model } from 'sequelize';

class ArchiveService {
  private sequelize: Sequelize;
  private archiveManager: ArchiveManager;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
    this.archiveManager = new ArchiveManager(sequelize);
  }

  async getArchiveModel(
    originalModelName: string
  ): Promise<ModelStatic<Model>> {
    const originalModel = this.sequelize.models[originalModelName];
    if (!originalModel) {
      throw new Error(`Original model ${originalModelName} not found`);
    }
    return this.archiveManager.getArchiveModel(originalModel);
  }

  async archiveRecords(
    originalModelName: string,
    whereClause: any,
    archiveMetadata: Record<string, any> = {}
  ): Promise<number> {
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

  async getArchivedData(
    originalModelName: string,
    filters: any = {}
  ): Promise<Model[]> {
    const ArchiveModel = await this.getArchiveModel(originalModelName);
    return await ArchiveModel.findAll({
      where: filters,
      order: [['archivedAt', 'DESC']],
    });
  }

  async restoreArchivedData(
    originalModelName: string,
    archivedRecordIds: any[]
  ): Promise<number> {
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

export { ArchiveService };
