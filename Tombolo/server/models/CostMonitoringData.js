'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CostMonitoringData extends Model {
    static associate(models) {
      CostMonitoringData.belongsTo(models.Application, {
        foreignKey: 'applicationId',
        as: 'application',
      });
      CostMonitoringData.belongsTo(models.CostMonitoring, {
        foreignKey: 'monitoringId',
        as: 'costMonitoring',
      });
    }
  }

  CostMonitoringData.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      applicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      clusterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      monitoringId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'cost_monitorings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      usersCostInfo: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      analyzed: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      notificationSentDate: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'CostMonitoringData',
      tableName: 'cost_monitoring_data',
      timestamps: true,
      paranoid: true,
      indexes: [],
    }
  );

  return CostMonitoringData;
};
