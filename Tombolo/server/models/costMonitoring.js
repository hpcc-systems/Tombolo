'use strict';
module.exports = (sequelize, DataTypes) => {
  const costMonitoring = sequelize.define(
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
      indexes: [
        {
          unique: true,
          fields: ['monitoringName', 'deletedAt'],
        },
      ],
    }
  );

  // Associations
  costMonitoring.associate = function (models) {
    costMonitoring.belongsTo(models.application, {
      foreignKey: 'applicationId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    costMonitoring.hasMany(models.costMonitoringData, {
      foreignKey: 'monitoringId',
      as: 'costMonitoringData',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    costMonitoring.belongsTo(models.user, {
      foreignKey: 'createdBy',
      as: 'creator',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });

    costMonitoring.belongsTo(models.user, {
      foreignKey: 'lastUpdatedBy',
      as: 'updater',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });

    costMonitoring.belongsTo(models.user, {
      foreignKey: 'approvedBy',
      as: 'approver',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
  };

  return costMonitoring;
};
