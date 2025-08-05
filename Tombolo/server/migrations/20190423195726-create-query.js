'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('query', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      title: Sequelize.STRING,
      name: Sequelize.STRING,
      description: Sequelize.TEXT,
      url: Sequelize.STRING,
      gitRepo: Sequelize.STRING,
      primaryService: Sequelize.STRING,
      backupService: Sequelize.STRING,
      type: Sequelize.STRING,
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
    return queryInterface.dropTable('query');
  },
};
