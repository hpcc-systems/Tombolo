"use strict";
module.exports = (sequelize, DataTypes) => {
  const UserApplication = sequelize.define(
    "UserApplication",
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
          model: "User",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "application",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      user_app_relation: {
        type: DataTypes.ENUM("created", "shared", "assigned"),
        allowNull: false,
      },
      createdBy: { // Who created this relation - creator himself/herself , admin or shared by other user
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: "user_application",
      paranoid: true,
      freezeTableName: true,
      timestamps: true,
    }
  );

  UserApplication.associate = function (models) {
    UserApplication.belongsTo(models.User, { foreignKey: "user_id" });
    UserApplication.belongsTo(models.application, {
      foreignKey: "application_id",
    });
  };

  return UserApplication;
};
