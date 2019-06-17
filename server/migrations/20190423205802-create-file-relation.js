'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('file_relation', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      application_id: {
        type: Sequelize.STRING
      },
      file_id: {
        type: Sequelize.STRING
      },
      source_file_id: {
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
    return queryInterface.dropTable('file_relation');
  }
};