'use strict';
module.exports = (sequelize, DataTypes) => {
  const LandingZoneMonitoring = sequelize.define(
    'landingZoneMonitoring',
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
          model: 'application',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      monitoringName: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      isActive: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
      lzMonitoringType: {
        allowNull: false,
        type: DataTypes.ENUM('fileCount', 'spaceUsage', 'fileMovement'),
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
      },
      lastRunDetails: {
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
    },
    {
      paranoid: true,
      freezeTableName: true,
    }
  );

  // Associations
  LandingZoneMonitoring.associate = function (models) {
    LandingZoneMonitoring.belongsTo(models.application, {
      foreignKey: 'applicationId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    LandingZoneMonitoring.belongsTo(models.cluster, {
      foreignKey: 'clusterId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });

    // User associations
    LandingZoneMonitoring.belongsTo(models.user, {
      foreignKey: 'createdBy',
      as: 'creator',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });

    LandingZoneMonitoring.belongsTo(models.user, {
      foreignKey: 'lastUpdatedBy',
      as: 'updater',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });

    LandingZoneMonitoring.belongsTo(models.user, {
      foreignKey: 'approvedBy',
      as: 'approver',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
  };

  return LandingZoneMonitoring;
};
