'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Integration extends Model {
    static associate(models) {
      Integration.hasMany(models.IntegrationMapping, {
        foreignKey: 'integration_id',
      });
    }
  }

  Integration.init(
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
      description: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    {
      sequelize,
      modelName: 'Integration',
      tableName: 'integrations',
      freezeTableName: true,
    }
  );

  return Integration;
};
