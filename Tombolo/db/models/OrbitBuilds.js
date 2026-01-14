'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrbitBuild extends Model {
    static associate(models) {
      OrbitBuild.belongsTo(models.Application, {
        foreignKey: 'application_id',
      });
      OrbitBuild.hasMany(models.MonitoringNotification, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });
    }
  }

  OrbitBuild.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      application_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      monitoring_id: {
        allowNull: true,
        type: DataTypes.UUID,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      wuid: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      build_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'OrbitBuilds',
      tableName: 'orbit_builds',
      paranoid: true,
    }
  );

  return OrbitBuild;
};
