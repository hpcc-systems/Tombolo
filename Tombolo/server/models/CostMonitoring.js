'use strict';

const { Model } = require('sequelize');
const { DeleteMixin } = require('../utils/modelMixins/DeleteMixin');

module.exports = (sequelize, DataTypes) => {
  class CostMonitoring extends DeleteMixin(Model) {
    static associate(models) {
      CostMonitoring.belongsTo(models.Application, {
        foreignKey: 'applicationId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      CostMonitoring.hasMany(models.CostMonitoringData, {
        foreignKey: 'monitoringId',
        as: 'costMonitoringData',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      CostMonitoring.belongsTo(models.user, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      CostMonitoring.belongsTo(models.user, {
        foreignKey: 'lastUpdatedBy',
        as: 'updater',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      CostMonitoring.belongsTo(models.user, {
        foreignKey: 'approvedBy',
        as: 'approver',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      CostMonitoring.belongsTo(models.user, {
        foreignKey: 'deletedBy',
        as: 'deleter',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  CostMonitoring.init(
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
      clusterIds: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          isValidUUIDArray(value) {
            if (value === null) return;
            if (!Array.isArray(value)) {
              throw new Error('clusterIds must be an array');
            }
            const isValid = value.every(id =>
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                id
              )
            );
            if (!isValid) {
              throw new Error('All clusterIds must be valid UUIDs');
            }
          },
        },
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
      modelName: 'CostMonitoring',
      tableName: 'cost_monitorings',
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['monitoringName', 'deletedAt'],
        },
      ],
    }
  );

  return CostMonitoring;
};
