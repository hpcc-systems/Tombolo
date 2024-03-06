"use strict";
module.exports = (sequelize, DataTypes) => {
  const AsrProducts = sequelize.define(
    "asr_products",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      shortCode: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      tier: {
        type: DataTypes.ENUM,
        values: ["0", "1", "2", "3"],
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: null,
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.JSON,
        defaultValue: { name: "system", email: "NA" },
      },
      updatedBy: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      deletedBy: {
        allowNull: true,
        type: DataTypes.JSON,
        defaultValue: null,
      },
    },
    {
      freezeTableName: true,
    }
  );

  return AsrProducts;
};
