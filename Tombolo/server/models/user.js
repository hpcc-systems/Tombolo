"use strict";

module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define(
    "user",
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      hash: {
        type: DataTypes.STRING,
        allowNull: true, // For OAuth users - no password is stored
      },
      registrationMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["traditional", "microsoft"]],
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
        defaultValue: "pending",
        validate: {
          isIn: [["pending", "active", "revoked"]], // Must be one of these values
        },
      },
      lastLoggedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      paranoid: true,

      // For paranoid tables, hooks are required to delete data from associated tables
      hooks: {
        beforeBulkDestroy: async (user, options) => {
          // Delete refresh tokens
          const RefreshTokens = sequelize.models.RefreshTokens;
          await RefreshTokens.destroy({
            where: {userId: user.where.id,},
          });

          // Delete user roles
          const UserRoles = sequelize.models.UserRoles;
          await UserRoles.destroy({
            where: {userId: user.where.id,},
          });
        },
      },
    }
  );

  // Associations
  user.associate = function (models) {
    user.hasMany(models.UserRoles, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      as: "roles",
    });

    //user to application relation
    user.hasMany(models.user_application, {
      foreignKey: "user_id",
      as: "applications", // Alias
      onDelete: "CASCADE",
    });

    // User to refresh token
    user.hasMany(models.RefreshTokens, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      hooks: true,
    });
  };


  return user;
};
