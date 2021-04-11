'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('job_execution', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      jobId: {
        type: Sequelize.STRING
      },
      dataflowId: {
        type: Sequelize.STRING
      },
      applicationId: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      wuid: {
        type: Sequelize.STRING
      },
      wu_start: {
        type: Sequelize.STRING
      },
      wu_end: {
        type: Sequelize.STRING
      },
      wu_duration: {
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
    return queryInterface.dropTable('job_execution');
  }
};