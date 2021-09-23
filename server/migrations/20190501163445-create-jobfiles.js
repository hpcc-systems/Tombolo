'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('jobfile', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      job_id: {
        type: Sequelize.STRING
      },
      application_id: {
        type: Sequelize.STRING
      },
      file_type: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.TEXT
      },
      description: {
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
    return queryInterface.dropTable('jobfile');
  }
};