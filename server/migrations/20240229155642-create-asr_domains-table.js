"use strict";
const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("asr_domains", {
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
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("asr_domains");
  },
};