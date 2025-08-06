'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MonitoringLog extends Model {
    static associate(models) {
      MonitoringLog.belongsTo(models.Cluster, {
        foreignKey: 'cluster_id',
        as: 'cluster',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
      MonitoringLog.belongsTo(models.monitoring_types, {
        foreignKey: 'monitoring_type_id',
        as: 'monitoring_types',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  MonitoringLog.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      cluster_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      monitoring_type_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      scan_time: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
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
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    {
      sequelize,
      modelName: 'MonitoringLog',
      tableName: 'monitoring_logs',
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['cluster_id', 'monitoring_type_id', 'deletedAt'],
        },
      ],
    }
  );

  return MonitoringLog;
};
