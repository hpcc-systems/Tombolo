'use strict';

const { Model } = require('sequelize');
const { DeleteMixin } = require('../utils/modelMixins/DeleteMixin');
const CLUSTER_MONITORING_TYPES = ['status', 'usage'];

module.exports = (sequelize, DataTypes) => {
  class ClusterMonitoring extends DeleteMixin(Model) {
    static associate(models) {
      ClusterMonitoring.belongsTo(models.Cluster, {
        foreignKey: 'clusterId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      ClusterMonitoring.belongsTo(models.user, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      ClusterMonitoring.belongsTo(models.user, {
        foreignKey: 'lastUpdatedBy',
        as: 'updater',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      ClusterMonitoring.belongsTo(models.user, {
        foreignKey: 'approvedBy',
        as: 'approver',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      ClusterMonitoring.belongsTo(models.user, {
        foreignKey: 'deletedBy',
        as: 'deleter',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  ClusterMonitoring.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      monitoringName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      clusterMonitoringType: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: ['status', 'usage'],
      },
      isActive: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
      approvalStatus: {
        allowNull: false,
        type: DataTypes.ENUM('approved', 'rejected', 'pending'),
        defaultValue: 'pending',
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
      lastRunDetails: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      metaData: {
        allowNull: false,
        type: DataTypes.JSON,
        defaultValue: {
          contacts: {
            primaryContacts: [],
            secondaryContacts: [],
            notifyContacts: [],
          },
          monitoringData: {},
          asrSpecificMetaData: {},
        },
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
        allowNull: false,
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
      modelName: 'ClusterMonitoring',
      tableName: 'cluster_monitorings',
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['monitoringName', 'deletedAt'],
        },
      ],
    }
  );

  return ClusterMonitoring;
};
