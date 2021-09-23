'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('query_field', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      query_id: {
        type: Sequelize.STRING
      },
      application_id: {
        type: Sequelize.STRING
      },
      field_type: {
        type: Sequelize.STRING
      },
      field: {
        type: Sequelize.STRING
      },
      type: {
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
    return queryInterface.dropTable('query_field');
  }
};