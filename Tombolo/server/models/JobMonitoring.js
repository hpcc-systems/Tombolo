'use strict';

const { Model } = require('sequelize');
const { DeleteMixin } = require('../utils/modelMixins/DeleteMixin');

module.exports = (sequelize, DataTypes) => {
  class JobMonitoring extends DeleteMixin(Model) {
    static associate(models) {
      JobMonitoring.belongsTo(models.Application, {
        foreignKey: 'applicationId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      JobMonitoring.belongsTo(models.Cluster, {
        foreignKey: 'clusterId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      JobMonitoring.hasMany(models.JobMonitoringData, {
        foreignKey: 'monitoringId',
        as: 'jobMonitoringData',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      JobMonitoring.hasMany(models.JobMonitoringDataArchive, {
        foreignKey: 'monitoringId',
        as: 'jobMonitoringDataArchive',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      JobMonitoring.belongsTo(models.user, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      JobMonitoring.belongsTo(models.user, {
        foreignKey: 'lastUpdatedBy',
        as: 'updater',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      JobMonitoring.belongsTo(models.user, {
        foreignKey: 'approvedBy',
        as: 'approver',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      JobMonitoring.belongsTo(models.user, {
        foreignKey: 'deletedBy',
        as: 'deleter',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  JobMonitoring.init(
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
      monitoringName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      isActive: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
      approvalStatus: {
        allowNull: false,
        type: DataTypes.ENUM('Approved', 'Rejected', 'Pending'),
      },
      approvedBy: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      approvedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      approverComment: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      description: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      monitoringScope: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      clusterId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      jobName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      lastJobRunDetails: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      metaData: {
        allowNull: false,
        type: DataTypes.JSON,
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
      lastUpdatedBy: {
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
      modelName: 'JobMonitoring',
      tableName: 'job_monitorings',
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['monitoringName', 'deletedAt'],
        },
      ],
    }
  );

  return JobMonitoring;
};
