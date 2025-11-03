'use strict';

const { Model } = require('sequelize');

/**
 * @param {import('sequelize').Sequelize} sequelize - The Sequelize instance for database connection.
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes for defining model fields.
 * @returns {typeof Model} - The defined Sequelize model for AccountVerificationCode.
 */
module.exports = (sequelize, DataTypes) => {
  class AccountVerificationCode extends Model {
    static associate(models) {
      AccountVerificationCode.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }

  AccountVerificationCode.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW + 24 * 60 * 60 * 1000,
      },
    },
    {
      sequelize,
      tableName: 'account_verification_codes',
      modelName: 'AccountVerificationCode',
      timestamps: true,
    }
  );

  return AccountVerificationCode;
};
