"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("asr_products", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      shortCode: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      tier: {
        type: Sequelize.ENUM("0", "1", "2", "3"),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: null,
      },
      createdBy: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: { name: "system", email: "NA" },
      },
      updatedBy: {
        allowNull: true,
        type: Sequelize.JSON,
      },
      deletedBy: {
        allowNull: true,
        type: Sequelize.JSON,
        defaultValue: null,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("asr_products");
  },
};
