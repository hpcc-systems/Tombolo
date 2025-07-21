'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('cluster', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      thor_host: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      thor_port: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      roxie_host: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      roxie_port: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      defaultEngine: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      timezone_offset: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      allowSelfSigned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      containerized: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      accountMetaData: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      adminEmails: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      reachabilityInfo: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      storageUsageHistory: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      metaData: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      createdBy: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      updatedBy: {
        type: Sequelize.JSON,
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
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('cluster');
  },
};
