'use strict';

const { sequelize } = require("../models");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('fileTemplate_license', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      application_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      fileTemplate_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      license_id : {
        type : Sequelize.UUID,
        allowNull: false,
      },
      name : {
        type : Sequelize.STRING
      },
      url:{
        type : Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('fileTemplate_license');
  }
};