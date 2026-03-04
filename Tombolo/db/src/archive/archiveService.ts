import { ArchiveManager, type ArchiveOptions } from './archiveUtils.js';
import { Sequelize, ModelStatic, Model, type WhereOptions } from 'sequelize';

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
}

export { ArchiveService };
