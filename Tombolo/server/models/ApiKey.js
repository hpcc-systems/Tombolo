'use strict';

const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * @param {import('sequelize').Sequelize} sequelize - The Sequelize instance for database connection.
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes for defining model fields.
 * @returns {typeof Model} - The defined Sequelize model for AccountVerificationCode.
 */
module.exports = (sequelize, DataTypes) => {
  class ApiKey extends Model {
    static associate(models) {
      ApiKey.belongsTo(models.application, {
        foreignKey: 'application_id',
      });
    }

    async validKey(apiKey) {
      return bcrypt.compareSync(apiKey, this.apiKey);
    }
  }

  ApiKey.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      application_id: DataTypes.UUID,
      apiKey: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      name: DataTypes.STRING,
      expirationDate: DataTypes.BIGINT,
      expired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      metaData: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: 'ApiKey',
      tableName: 'api_keys',
      paranoid: true,
      hooks: {
        beforeCreate: async apiKey => {
          if (apiKey.apiKey) {
            const salt = await bcrypt.genSaltSync(10, 'a');
            apiKey.apiKey = bcrypt.hashSync(apiKey.apiKey, salt);
          }
        },
        beforeUpdate: async apiKey => {
          if (apiKey.apiKey) {
            const salt = await bcrypt.genSaltSync(10, 'a');
            apiKey.apiKey = bcrypt.hashSync(apiKey.apiKey, salt);
          }
        },
      },
    }
  );

  return ApiKey;
};
