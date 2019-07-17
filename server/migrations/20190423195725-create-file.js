'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('file', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      id: {
        type: Sequelize.STRING
      },
      application_id: {
        type: Sequelize.STRING
      },
      title: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      fileType: {
        type: Sequelize.STRING
      },
      isSuperFile: {
        type: Sequelize.STRING
      },
      primaryService: {
        type: Sequelize.STRING
      },
      backupService: {
        type: Sequelize.STRING
      },
      qualifiedPath: {
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
    return queryInterface.dropTable('file');
  }
};