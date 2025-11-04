'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('github_repo_settings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      ghProject: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      ghLink: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      ghBranchOrTag: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      ghToken: {
        type: Sequelize.STRING,
      },
      ghUserName: {
        type: Sequelize.STRING,
      },
      application_id: {
        type: Sequelize.UUID,
        references: {
          model: 'applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('github_repo_settings');
  },
};
