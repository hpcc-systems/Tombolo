'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('fileMonitoring', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      wuid: {
        allowNull: false,
        type: Sequelize.STRING
      },
      fileTemplateId:{
        allowNull: false,
        type: Sequelize.UUID
      },
      cluster_id: {
        allowNull: false,
        type: Sequelize.UUID
      },
      metaData : {
        type : Sequelize.JSON,
        allowNull : true
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
    return queryInterface.dropTable('fileMonitoring');
  }
};
