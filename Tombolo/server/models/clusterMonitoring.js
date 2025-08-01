'use strict';

const { validate } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ClusterMonitoring = sequelize.define(
    'cluster_monitoring',
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
        unique: true,
      },
      clusterMonitoringType: {
        allowNull: false,
        type: DataTypes.JSON,
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
          model: 'cluster',
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
      paranoid: true,
      freezeTableName: true,
    }
  );

  // Associations
  ClusterMonitoring.associate = function (models) {
    ClusterMonitoring.belongsTo(models.cluster, {
      foreignKey: 'clusterId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // User associations
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
  };

  return ClusterMonitoring;
};
