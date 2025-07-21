const { DataTypes, Op } = require('sequelize');

class ArchiveManager {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.archiveModels = new Map();
  }

  getArchiveModel(originalModel) {
    const modelName = originalModel.name;
    const archiveModelName = `${modelName}Archive`;

    if (this.archiveModels.has(archiveModelName)) {
      return this.archiveModels.get(archiveModelName);
    }

    const archiveModel = this.createArchiveModel(
      originalModel,
      archiveModelName
    );
    this.archiveModels.set(archiveModelName, archiveModel);
    return archiveModel;
  }

  createArchiveModel(originalModel, archiveModelName) {
    const attributes = { ...originalModel.getAttributes() };

    attributes.archivedAt = {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    };

    return this.sequelize.define(archiveModelName, attributes, {
      tableName: `${originalModel.tableName}Archive`,
      timestamps: true,
      paranoid: true,
    });
  }

  async archiveRecords(originalModel, whereClause, archiveMetadata = {}) {
    const ArchiveModel = this.getArchiveModel(originalModel);

    const transaction = await this.sequelize.transaction();
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
        originalId: record.id,
        archivedAt: new Date(),
        ...archiveMetadata,
      }));

      await ArchiveModel.bulkCreate(archiveData, { transaction });

      await originalModel.destroy({
        where: { id: { [Op.in]: recordsToArchive.map(r => r.id) } },
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

module.exports = { ArchiveManager };
