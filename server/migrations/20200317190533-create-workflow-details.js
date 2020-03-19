'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('workflowdetails', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      workflow_id: {
        type: Sequelize.STRING
      },
      application_id: {
        type: Sequelize.STRING
      },
      task: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.TEXT
      },
      wuid: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('workflowdetails');
  }
};