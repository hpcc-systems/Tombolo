'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('job', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      application_id: {
        type: Sequelize.STRING
      },
      author: {
        type: Sequelize.STRING
      },
      contact: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      entryBWR: {
        type: Sequelize.STRING
      },
      gitRepo: {
        type: Sequelize.STRING
      },
      jobType: {
        type: Sequelize.STRING
      },
      name: {
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
    return queryInterface.dropTable('job');
  }
};