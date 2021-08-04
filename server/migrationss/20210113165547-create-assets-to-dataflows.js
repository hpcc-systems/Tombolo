'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('assets_dataflows', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      assetId: {
        allowNull: false,
        type: Sequelize.UUID
      },
      dataflowId: {
        allowNull: false,
        type: Sequelize.UUID
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
    return queryInterface.dropTable('assets_dataflows');
  }
};