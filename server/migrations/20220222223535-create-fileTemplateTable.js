'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('fileTemplate', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      application_id: {
        allowNull: false,
        type: Sequelize.UUID
      },
      cluster_id: {
        allowNull: false,
        type: Sequelize.UUID
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      fileNamePattern: {
        allowNull: false,
        type: Sequelize.STRING
      },
      searchString: {
        allowNull: false,
        type: Sequelize.STRING
      }, 
      sampleLayoutFile:{
        allowNull: true,
         type: Sequelize.STRING
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
    return queryInterface.dropTable('fileTemplate');
  }
};