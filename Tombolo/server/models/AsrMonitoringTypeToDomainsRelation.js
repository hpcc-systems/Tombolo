'use strict';

const { Model, DataTypes } = require('sequelize');
const { DeleteMixin } = require('../utils/modelMixins/DeleteMixin');

module.exports = sequelize => {
  class AsrMonitoringTypeToDomainsRelation extends DeleteMixin(Model) {
    static associate(models) {
      AsrMonitoringTypeToDomainsRelation.belongsTo(models.MonitoringType, {
        foreignKey: 'monitoring_type_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      AsrMonitoringTypeToDomainsRelation.belongsTo(models.AsrDomain, {
        foreignKey: 'domain_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      AsrMonitoringTypeToDomainsRelation.belongsTo(models.user, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
      AsrMonitoringTypeToDomainsRelation.belongsTo(models.user, {
        foreignKey: 'updatedBy',
        as: 'updater',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
      AsrMonitoringTypeToDomainsRelation.belongsTo(models.user, {
        foreignKey: 'deletedBy',
        as: 'deleter',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  AsrMonitoringTypeToDomainsRelation.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      monitoring_type_id: {
        type: DataTypes.UUID,
        references: {
          model: 'monitoring_types',
          key: 'id',
        },
      },
      domain_id: {
        type: DataTypes.UUID,
        references: {
          model: 'asr_domains',
          key: 'id',
        },
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
      modelName: 'AsrMonitoringTypeToDomainsRelation',
      tableName: 'asr_monitoring_type_to_domains_relations',
      paranoid: true,
    }
  );

  return AsrMonitoringTypeToDomainsRelation;
};
