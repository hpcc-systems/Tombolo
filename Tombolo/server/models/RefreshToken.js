// Model for storing refresh token [ id - uuid , userId - uuid, token - string, device Info - json, timestamp, paranoid, freeze table name ]
'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RefreshToken extends Model {
    static associate(models) {
      RefreshToken.belongsTo(models.user, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        hooks: true,
      });
    }
  }

  RefreshToken.init(
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
      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      deviceInfo: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      iat: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      exp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'RefreshToken',
      tableName: 'refresh_tokens',
      timestamps: true,
      paranoid: true,
    }
  );

  return RefreshToken;
};
