'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserArchive extends Model {
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // Define associations here if needed
    }
  }

  UserArchive.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      removedBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      removedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      registrationMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['traditional', 'azure']],
        },
      },
      verifiedUser: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      registrationStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'active', 'revoked']], // Must be one of these values
        },
      },
      forcePasswordReset: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      passwordExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastAccessedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metaData: {
        type: DataTypes.JSON,
        defaultValue: {}, //put default value to avoid null conflicts
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'UserArchive',
      tableName: 'user_archives',
      timestamps: true,
    }
  );

  return UserArchive;
};
