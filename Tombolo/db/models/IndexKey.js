'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IndexKey extends Model {
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // associations can be defined here
    }
  }

  IndexKey.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      application_id: DataTypes.UUID,
      index_id: DataTypes.UUID,
      name: DataTypes.STRING,
      type: DataTypes.STRING,
      eclType: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'IndexKey',
      tableName: 'index_keys',
      paranoid: true,
    }
  );

  return IndexKey;
};
