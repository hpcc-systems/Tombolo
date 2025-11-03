'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrbitMonitoring extends Model {
    static associate(models) {
      OrbitMonitoring.belongsTo(models.Application, {
        foreignKey: 'application_id',
      });
      OrbitMonitoring.hasMany(models.MonitoringNotification, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });
    }
  }

  OrbitMonitoring.init(
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
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      cron: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      build: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      businessUnit: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      product: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      severityCode: {
        allowNull: false,
        type: DataTypes.TINYINT,
      },
      host: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      primaryContact: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      secondaryContact: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'OrbitMonitoring',
      tableName: 'orbit_monitorings',
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['name', 'deletedAt'],
        },
      ],
    }
  );

  return OrbitMonitoring;
};
