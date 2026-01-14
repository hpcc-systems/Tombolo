'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrbitBuildData extends Model {
    static associate(models) {
      // define associations here if needed
    }
  }

  OrbitBuildData.init(
    {
      BuildInstanceIdKey: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
      },
      BuildTemplateIdKey: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      Name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      HpccWorkUnit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      DateUpdated: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      Status_Code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      Version: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      observed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      stable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      stable_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_analyzed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      monitoring_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      notification_state: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status_history: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      processed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'OrbitBuildData',
      tableName: 'orbit_build_data',
      paranoid: true,
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      deletedAt: 'deletedAt',
    }
  );

  return OrbitBuildData;
};
