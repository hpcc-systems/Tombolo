// user and role types mapping table
'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserRole extends Model {
    static associate(models) {
      UserRole.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      UserRole.belongsTo(models.RoleType, {
        foreignKey: 'roleId',
        as: 'role_details',
      });
    }
  }

  UserRole.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users', // Name of the users table
          key: 'id',
        },
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'role_types', // Name of the role_types table
          key: 'id',
        },
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'UserRole',
      tableName: 'user_roles',
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  );

  return UserRole;
};
