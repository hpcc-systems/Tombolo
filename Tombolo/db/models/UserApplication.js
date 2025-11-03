'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserApplication extends Model {
    static associate(models) {
      UserApplication.belongsTo(models.User, { foreignKey: 'user_id' });
      UserApplication.belongsTo(models.Application, {
        foreignKey: 'application_id',
      });
    }
  }

  UserApplication.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_app_relation: {
        type: DataTypes.ENUM('created', 'shared', 'assigned'),
        allowNull: false,
      },
      createdBy: {
        // Who created this relation - creator himself/herself , admin or shared by other user
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'UserApplication',
      tableName: 'user_applications',
      paranoid: true,
      timestamps: true,
    }
  );

  return UserApplication;
};
