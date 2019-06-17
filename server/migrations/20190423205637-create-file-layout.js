'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('file_layout', {
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
      type: {
        type: Sequelize.STRING
      },
      displayType: {
        type: Sequelize.STRING
      },
      displaySize: {
        type: Sequelize.STRING
      },
      textJustification: {
        type: Sequelize.STRING
      },
      format: {
        type: Sequelize.STRING
      },
      isSPII: {
        type: Sequelize.STRING
      },
      isPII: {
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
    return queryInterface.dropTable('file_layout');
  }
};