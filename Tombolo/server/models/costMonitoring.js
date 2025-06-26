'use strict';
module.exports = (sequelize, DataTypes) => {
  const CostMonitoring = sequelize.define(
    'costMonitoring',
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
      approvalStatus: {
        allowNull: false,
        type: DataTypes.ENUM('Approved', 'Rejected', 'Pending'),
      },
      approvedBy: {
        allowNull: true,
        type: DataTypes.STRING,
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
          // Ensure the clusterIds are in an array and valid UUID
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
        type: DataTypes.STRING,
      },
      lastUpdatedBy: {
        allowNull: false,
        type: DataTypes.STRING,
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
  CostMonitoring.associate = function (models) {
    CostMonitoring.belongsTo(models.application, {
      foreignKey: 'applicationId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    CostMonitoring.belongsTo(models.cluster, {
      foreignKey: 'cluster_id',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });

    CostMonitoring.hasMany(models.costMonitoringData, {
      foreignKey: 'monitoringId',
      as: 'costMonitoringData',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // TODO: Do we need an archive?
    // CostMonitoring.hasMany(models.jobMonitoring_Data_Archive, {
    //   foreignKey: 'monitoringId',
    //   as: 'costMonitoringDataArchive',
    //   onDelete: 'CASCADE',
    //   onUpdate: 'CASCADE',
    // });
  };

  return CostMonitoring;
};
