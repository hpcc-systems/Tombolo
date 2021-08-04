'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('index_payload', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      index_id: {
        type: Sequelize.STRING
      },
      application_id: {
        type: Sequelize.STRING
      },
      ColumnLabel: {
        type: Sequelize.STRING
      },
      ColumnType: {
        type: Sequelize.STRING
      },
      ColumnEclType: {
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
    return queryInterface.dropTable('index_payload');
  }
};