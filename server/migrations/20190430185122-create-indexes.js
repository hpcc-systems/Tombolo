'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('indexes', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      application_id: {
        type: Sequelize.STRING
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
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
      parentFileId: {
        type: Sequelize.STRING
      },
      registrationTime: {
        type: Sequelize.STRING
      },
      updatedDateTime: {
        type: Sequelize.STRING
      },
      dataLastUpdatedTime: {
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
    return queryInterface.dropTable('indexes');
  }
};