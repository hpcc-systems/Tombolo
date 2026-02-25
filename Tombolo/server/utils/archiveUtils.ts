import {
  DataTypes,
  Op,
  Sequelize,
  Model,
  Transaction,
  ModelStatic,
  ModelAttributes,
} from 'sequelize';

class ArchiveManager {
  private sequelize: Sequelize;
  private archiveModels: Map<string, ModelStatic<Model>>;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
    this.archiveModels = new Map();
  }

  getArchiveModel(originalModel: ModelStatic<Model>): ModelStatic<Model> {
    const modelName = originalModel.name;
    const archiveModelName = `${modelName}Archive`;

    if (this.archiveModels.has(archiveModelName)) {
      return this.archiveModels.get(archiveModelName)!;
    }

    const archiveModel = this.createArchiveModel(
      originalModel,
      archiveModelName
    );
    this.archiveModels.set(archiveModelName, archiveModel);
    return archiveModel;
  }

  createArchiveModel(
    originalModel: ModelStatic<Model>,
    archiveModelName: string
  ): ModelStatic<Model> {
    // Use getAttributes() which returns current attributes, not cached rawAttributes
    const attributes: ModelAttributes<Model> = {
      ...originalModel.getAttributes(),
    };

    // Add archivedAt field for tracking when records were archived
    attributes.archivedAt = {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    };

    return this.sequelize.define(archiveModelName, attributes, {
      tableName: `${originalModel.tableName}_archive`,
      timestamps: true,
      paranoid: true,
    });
  }

  async archiveRecords(
    originalModel: ModelStatic<Model>,
    whereClause: any,
    archiveMetadata: Record<string, any> = {}
  ): Promise<number> {
    const ArchiveModel = this.getArchiveModel(originalModel);

    const transaction: Transaction = await this.sequelize.transaction();
    try {
      const recordsToArchive = await originalModel.findAll({
        where: whereClause,
        transaction,
      });

      if (recordsToArchive.length === 0) {
        await transaction.rollback();
        return 0;
      }

      const archiveData = recordsToArchive.map(record => ({
        ...record.toJSON(),
        originalId: record.get('id'),
        archivedAt: new Date(),
        ...archiveMetadata,
      }));

      await ArchiveModel.bulkCreate(archiveData, { transaction });

      await originalModel.destroy({
        where: { id: { [Op.in]: recordsToArchive.map(r => r.get('id')) } },
        transaction,
      });

      await transaction.commit();
      return recordsToArchive.length;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export { ArchiveManager };
