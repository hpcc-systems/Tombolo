'use strict';
const { Model, DataTypes } = require('sequelize');
const { DeleteMixin } = require('../utils/modelMixins/DeleteMixin');

module.exports = sequelize => {
  class AsrDomain extends DeleteMixin(Model) {
    static associate(models) {
      AsrDomain.belongsToMany(models.monitoring_types, {
        through: 'asr_monitoring_type_to_domains_relations',
        foreignKey: 'domain_id',
        as: 'monitoringTypes',
      });

      AsrDomain.belongsToMany(models.AsrProduct, {
        through: 'asr_domain_to_products_relations',
        foreignKey: 'domain_id',
        as: 'associatedProducts',
      });

      AsrDomain.belongsTo(models.user, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      AsrDomain.belongsTo(models.user, {
        foreignKey: 'updatedBy',
        as: 'updater',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      AsrDomain.belongsTo(models.user, {
        foreignKey: 'deletedBy',
        as: 'deleter',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  AsrDomain.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      region: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      severityThreshold: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      severityAlertRecipients: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      updatedBy: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      deletedBy: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
    },
    {
      sequelize,
      tableName: 'asr_domains',
      modelName: 'AsrDomain',
      paranoid: true,
    }
  );

  return AsrDomain;
};
