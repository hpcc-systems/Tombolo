"use strict";

module.exports = (sequelize, DataTypes) => {
  const instance_settings = sequelize.define(
    "instance_settings",
    {
      id: {
        primaryKey: true,
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "NO ACTION",
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "NO ACTION",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      freezeTableName: true,
      tableName: "instance_settings", // Table name for this model
    }
  );

  return instance_settings;
};
