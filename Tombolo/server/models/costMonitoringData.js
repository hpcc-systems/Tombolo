'use strict';
module.exports = (sequelize, DataTypes) => {
  const CostMonitoringData = sequelize.define(
    'costMonitoringData',
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
      monitoringId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'costMonitoring',
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
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
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
      tableName: 'costMonitoringData',
      timestamps: true,
      paranoid: true,
      indexes: [
        // TODO: What to index here?
        // {
        //   unique: true,
        //   fields: ['monitoringId', 'wuId'],
        //   name: 'unique_monitoringId_wuId', // Match the migration constraint name
        // },
      ],
    }
  );

  // Associations
  CostMonitoringData.associate = models => {
    CostMonitoringData.belongsTo(models.application, {
      foreignKey: 'applicationId',
      as: 'application',
    });
    CostMonitoringData.belongsTo(models.costMonitoring, {
      foreignKey: 'monitoringId',
      as: 'costMonitoring',
    });
  };

  return CostMonitoringData;
};
