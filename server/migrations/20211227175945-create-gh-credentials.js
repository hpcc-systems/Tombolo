'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('GHCredentials', {
      id: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.UUID
      },
      userId: {
        type: Sequelize.STRING
      },
      GHUsername: {
        type: Sequelize.STRING
      },
      GHToken: {
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
      deletedAt:{
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('GHCredentials');
  }
};