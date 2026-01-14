'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class landingZoneMonitoring extends Model {
    static associate(models) {
      landingZoneMonitoring.belongsTo(models.Application, {
        foreignKey: 'application_id',
      });
      landingZoneMonitoring.belongsTo(models.Cluster, {
        foreignKey: 'cluster_id',
      });
    }
  }

  landingZoneMonitoring.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      application_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      cluster_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      description: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      cron: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      type: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      active: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      machine: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      landingZone: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      directory: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      approved: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      approvalStatus: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      approvalNote: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      approvedBy: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      approvedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      updatedBy: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'landingZoneMonitoring',
      tableName: 'directory_monitorings',
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['name', 'deletedAt'],
        },
      ],
    }
  );

  return landingZoneMonitoring;
};
