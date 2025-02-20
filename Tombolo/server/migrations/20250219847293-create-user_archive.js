"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("user_archive", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      removedBy: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      removedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      registrationMethod: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isIn: [["traditional", "microsoft"]],
        },
      },
      verifiedUser: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      registrationStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isIn: [["pending", "active", "revoked"]],
        },
      },
      forcePasswordReset: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      passwordExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastAccessedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      metaData: {
        type: Sequelize.JSON,
        defaultValue: {},
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("users");
  },
};
