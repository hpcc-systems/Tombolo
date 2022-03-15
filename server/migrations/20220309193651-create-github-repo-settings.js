'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('github_repo_settings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'application',
          key: 'id'
      }
      },
      ghProject: {
        allowNull: false,
        type: Sequelize.STRING
      },
      ghLink: {
        allowNull: false,
        type: Sequelize.STRING
      },
      ghBranchOrTag: {
        allowNull: false,
        type: Sequelize.STRING
      },
      ghToken: {
        type: Sequelize.STRING
      },
      ghUserName: {
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('github_repo_settings');
  }
};