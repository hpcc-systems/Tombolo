'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
      hash: {
        type: Sequelize.STRING,
        allowNull: true, // For OAuth users - no password is stored
      },
      registrationMethod: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isIn: [['traditional', 'azure']],
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
          isIn: [['pending', 'active', 'revoked']],
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
      loginAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      accountLocked: {
        type: Sequelize.JSON,
        defaultValue: {
          isLocked: false,
          lockedReason: [],
        },
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
    await queryInterface.dropTable('users');
  },
};
