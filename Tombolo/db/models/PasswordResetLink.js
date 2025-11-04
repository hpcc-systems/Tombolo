'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PasswordResetLink extends Model {
    static associate(models) {
      PasswordResetLink.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        hooks: true,
      });
    }
  }

  PasswordResetLink.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      resetLink: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      issuedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'PasswordResetLink',
      tableName: 'password_reset_links',
      timestamps: true,
    }
  );

  return PasswordResetLink;
};
