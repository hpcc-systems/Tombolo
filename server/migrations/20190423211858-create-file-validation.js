'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('file_validation', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      application_id: {
        type: Sequelize.STRING
      },
      file_id: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      sequence: {
        type: Sequelize.STRING
      },
      ruleType: {
        type: Sequelize.STRING
      },
      rule: {
        type: Sequelize.STRING
      },
      action: {
        type: Sequelize.STRING
      },
      fixScript: {
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
    return queryInterface.dropTable('file_validation');
  }
};