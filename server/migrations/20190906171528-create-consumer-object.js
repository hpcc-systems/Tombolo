'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('consumer_object', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      consumer_id: {
        type: Sequelize.STRING
      },
      object_id: {
        type: Sequelize.STRING
      },
      object_type: {
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
    return queryInterface.dropTable('consumer_object');
  }
};