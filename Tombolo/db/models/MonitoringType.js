'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MonitoringType extends Model {
    static associate(models) {
      MonitoringType.belongsToMany(models.AsrDomain, {
        through: 'asr_monitoring_type_to_domains_relations',
        foreignKey: 'monitoring_type_id',
        as: 'asr_domains',
      });
    }
  }

  MonitoringType.init(
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
        type: DataTypes.JSON,
        defaultValue: { firstName: null, lastName: 'System', email: 'NA' },
      },
      updatedBy: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      deletedBy: {
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    {
      sequelize,
      modelName: 'MonitoringType',
      tableName: 'monitoring_types',
      freezeTableName: true,
    }
  );

  return MonitoringType;
};
