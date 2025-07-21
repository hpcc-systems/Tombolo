"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("password_reset_links", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users", // Name of the users model
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      resetLink: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      issuedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("password_reset_links");
  },
};
