'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RoleType extends Model {
    static associate(models) {
      RoleType.hasMany(models.UserRole, {
        foreignKey: 'roleId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }

  RoleType.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      roleName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'RoleType',
      tableName: 'role_types',
      timestamps: true,
      paranoid: true,
      hooks: {
        beforeBulkDestroy: async roleType => {
          const UserRole = sequelize.models.UserRole;
          await UserRole.destroy({ where: { roleId: roleType.where.id } });
        },
      },
    }
  );

  return RoleType;
};
