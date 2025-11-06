'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class License extends Model {
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // associations can be defined here
    }
  }

  License.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      name: DataTypes.STRING,
      url: DataTypes.STRING,
      description: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'License',
      tableName: 'licenses',
      freezeTableName: true,
    }
  );

  return License;
};
