'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('tree_style', {
      id: {
        allowNull: false,
        primaryKey: false,
        type: Sequelize.UUID
      },
      application_id: {
        primaryKey: true,
        type: Sequelize.STRING
      },
      node_id: {
        primaryKey: true,
        type: Sequelize.STRING
      },
      style: {
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
    return queryInterface.dropTable('tree_style');
  }
};