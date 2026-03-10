import { ArchiveManager, type ArchiveOptions } from './archiveUtils.js';
import {
  Op,
  Sequelize,
  ModelStatic,
  Model,
  type WhereOptions,
} from 'sequelize';

class ArchiveService {
  protected sequelize: Sequelize;
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
    whereClause: WhereOptions,
    archiveMetadata: Record<string, unknown> = {},
    options: ArchiveOptions = {}
  ): Promise<number> {
    const originalModel = this.sequelize.models[originalModelName];
    if (!originalModel) {
      throw new Error(`Original model ${originalModelName} not found`);
    }

    return await this.archiveManager.archiveRecords(
      originalModel,
      whereClause,
      archiveMetadata,
      options
    );
  }

  async getArchivedData(
    originalModelName: string,
    filters: WhereOptions = {}
  ): Promise<Model[]> {
    const ArchiveModel = await this.getArchiveModel(originalModelName);
    return await ArchiveModel.findAll({
      where: filters,
      order: [['archivedAt', 'DESC']],
    });
  }

  async restoreArchivedData(
    originalModelName: string,
    ids: (string | number)[]
  ): Promise<number> {
    const originalModel = this.sequelize.models[originalModelName];
    if (!originalModel) {
      throw new Error(`Original model ${originalModelName} not found`);
    }

    const ArchiveModel = this.archiveManager.getArchiveModel(originalModel);
    const transaction = await this.sequelize.transaction();

    try {
      const archivedRecords = await ArchiveModel.findAll({
        where: { id: { [Op.in]: ids } },
        transaction,
      });

      if (archivedRecords.length === 0) {
        await transaction.rollback();
        return 0;
      }

      const restoreData = archivedRecords.map(record => {
        const { archivedAt: _archivedAt, ...data } = record.toJSON() as Record<
          string,
          unknown
        >;
        return data;
      });

      await originalModel.bulkCreate(restoreData, { transaction });

      await ArchiveModel.destroy({
        where: { id: { [Op.in]: ids } },
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
