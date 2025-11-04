'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DataType extends Model {
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // associations Can be defined here
    }
  }

  DataType.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'DataType',
      tableName: 'data_types',
      paranoid: true,
    }
  );

  return DataType;
};
