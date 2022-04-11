'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('fileTemplateLayout', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      application_id: {
        allowNull: false,
        type: Sequelize.UUID
      },
      fileTemplate_id: {
        allowNull: false,
        type: Sequelize.UUID
      },
     fields :{
      allowNull: true,
      type: Sequelize.JSON
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
    return queryInterface.dropTable('fileTemplateLayout');
  }
};