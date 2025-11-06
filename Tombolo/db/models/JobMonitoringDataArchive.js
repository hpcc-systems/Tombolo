'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JobMonitoringDataArchive extends Model {
    static associate(models) {
      JobMonitoringDataArchive.belongsTo(models.Application, {
        foreignKey: 'applicationId',
        as: 'application',
      });
      JobMonitoringDataArchive.belongsTo(models.JobMonitoring, {
        foreignKey: 'monitoringId',
        as: 'jobMonitoring',
      });
    }
  }

  JobMonitoringDataArchive.init(
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
      wuId: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      wuState: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      monitoringId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'job_monitorings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      wuTopLevelInfo: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      wuDetailInfo: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      analyzed: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSONB,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'JobMonitoringDataArchive',
      tableName: 'job_monitoring_data_archives',
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['monitoringId', 'wuId'],
          name: 'jm_data_archive_unique_monitoringId_wuId',
        },
      ],
    }
  );

  return JobMonitoringDataArchive;
};
