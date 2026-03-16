import {
  DataTypes,
  Op,
  Sequelize,
  Model,
  Transaction,
  ModelStatic,
  ModelAttributeColumnOptions,
  type WhereOptions,
} from 'sequelize';

interface ArchiveOptions {
  batchSize?: number;
  forceDelete?: boolean;
}

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
    const attributes: Record<string, ModelAttributeColumnOptions> = {
      ...originalModel.getAttributes(),
    };

    // Add archivedAt field for tracking when records were archived
    attributes.archivedAt = {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When this record was archived',
    };

    return this.sequelize.define(archiveModelName, attributes, {
      tableName: `${originalModel.tableName}_archive`,
      timestamps: true,
      paranoid: true,
    });
  }

  async archiveRecords(
    originalModel: ModelStatic<Model>,
    whereClause: WhereOptions,
    archiveMetadata: Record<string, unknown> = {},
    options: ArchiveOptions = {}
  ): Promise<number> {
    const ArchiveModel = this.getArchiveModel(originalModel);
    const batchSize = Math.max(1, options.batchSize ?? 1000);
    const forceDelete = options.forceDelete ?? false;

    let totalArchived = 0;

    while (true) {
      const transaction: Transaction = await this.sequelize.transaction();
      try {
        const recordsToArchive = await originalModel.findAll({
          where: whereClause,
          limit: batchSize,
          order: [['id', 'ASC']],
          transaction,
        });

        if (recordsToArchive.length === 0) {
          await transaction.rollback();
          break;
        }

        const archiveData = recordsToArchive.map(record => ({
          ...record.toJSON(),
          archivedAt: new Date(),
          ...archiveMetadata,
        }));

        await ArchiveModel.bulkCreate(archiveData, { transaction });

        await originalModel.destroy({
          where: { id: { [Op.in]: recordsToArchive.map(r => r.get('id')) } },
          transaction,
          force: forceDelete,
        });

        await transaction.commit();
        totalArchived += recordsToArchive.length;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    return totalArchived;
  }
}

export { ArchiveManager };
export type { ArchiveOptions };
