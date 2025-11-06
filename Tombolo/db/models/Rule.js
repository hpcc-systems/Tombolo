'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Rule extends Model {
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // associations can be defined here
    }
  }

  Rule.init(
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
      modelName: 'Rule',
      tableName: 'rules',
      paranoid: true,
      freezeTableName: true,
    }
  );

  return Rule;
};
