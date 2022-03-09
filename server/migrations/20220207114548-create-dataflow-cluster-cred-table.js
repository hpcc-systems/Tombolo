'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('dataflow_cluster_credentials', {
      id: {
        type: Sequelize.UUID
      },
      dataflow_id: {
        type: Sequelize.STRING
      },
      cluster_id: {
        type: Sequelize.STRING
      },
      cluster_username: {
        type: Sequelize.STRING
      },
      cluster_hash: {
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
    return queryInterface.dropTable('dataflow_cluster_credentials');
  }
};