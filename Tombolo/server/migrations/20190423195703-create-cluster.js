"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("cluster", {
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
        allowNull: true,
      },
      thor_port: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      roxie_host: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      roxie_port: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      defaultEngine:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      timezone_offset: {
        type: Sequelize.INTEGER,
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
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("cluster");
  },
};
