"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
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
      verifiedAt:{
        type: DataTypes.DATE,
        allowNull: true,
      },
      registrationStatus: {
        type: DataTypes.STRING,
        allowNull: false,
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
    }
  );

  User.associate = function (models) {
    // associations can be defined here
    User.belongsToMany(models.RoleTypes, {
      through: models.UserRoles,
      foreignKey: "userId",
      onDelete: "CASCADE",
    });

    //user to application relation
    User.hasMany(models.UserApplication, {
      foreignKey: "user_id",
      onDelete: "CASCADE",
    });
  };
  return User;
};
