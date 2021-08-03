'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('visualizations', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID      
      },
      assetId: {
        type: Sequelize.UUID
      },
      name: {
        type: Sequelize.STRING
      },
      application_id: {
        type: Sequelize.UUID
      },
      type: {
        type: Sequelize.STRING
      },
      url: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      clusterId: {
        type: Sequelize.UUID
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
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('visualizations');
  }
};