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
        allowNull: false,
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
      timezone_offset: {
        type: Sequelize.INTEGER,
        allowNull: true, // TODO Must be changed to false once we are able to get default engine for containerized cluster
      },
      defaultEngine: {
        type: Sequelize.JSON,
        defaultValue: "hthor", // TODO Must be allowNull - false &&& no default value  once we are able to get default engine for containerized cluster
      },
      accountMetaData: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      metaData: {
        type: Sequelize.JSON,
        defaultValue: {},
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
