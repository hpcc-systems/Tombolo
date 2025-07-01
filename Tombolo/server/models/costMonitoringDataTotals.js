'use strict';
const { Model } = require('sequelize');

// THIS IS A VIEW NOT A TABLE
module.exports = (sequelize, DataTypes) => {
  class CostMonitoringDataTotals extends Model {
    static associate(models) {
      // Association to access the costMonitoring configuration
      CostMonitoringDataTotals.belongsTo(models.costMonitoring, {
        foreignKey: 'monitoringId',
        as: 'costMonitoring',
      });
    }
  }

  CostMonitoringDataTotals.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      monitoringId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      timezone_offset: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      compileCost: {
        type: DataTypes.DECIMAL(10, 5),
        allowNull: true,
        get() {
          const value = this.getDataValue('compileCost');
          return value ? parseFloat(value) : 0;
        },
      },
      fileAccessCost: {
        type: DataTypes.DECIMAL(10, 5),
        allowNull: true,
        get() {
          const value = this.getDataValue('fileAccessCost');
          return value ? parseFloat(value) : 0;
        },
      },
      executeCost: {
        type: DataTypes.DECIMAL(10, 5),
        allowNull: true,
        get() {
          const value = this.getDataValue('executeCost');
          return value ? parseFloat(value) : 0;
        },
      },
      totalCost: {
        type: DataTypes.DECIMAL(10, 5),
        allowNull: true,
        get() {
          const value = this.getDataValue('totalCost');
          return value ? parseFloat(value) : 0;
        },
      },
    },
    {
      sequelize,
      modelName: 'costMonitoringDataTotals',
      tableName: 'costmonitoringdatatotals',
      timestamps: false, // Views don't have timestamps
      freezeTableName: true,
    }
  );

  return CostMonitoringDataTotals;
};
