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
        type: Sequelize.INTEGER,
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
        defaultValue: { email: "NA", lastName: "System", firstName: "NA" },
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
