'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TokenBlackList extends Model {
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // associations can be defined here
    }
  }

  TokenBlackList.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.STRING,
        allowNull: false,
      },
      exp: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'TokenBlackList',
      tableName: 'token_black_list',
      timestamps: false,
    }
  );

  return TokenBlackList;
};
