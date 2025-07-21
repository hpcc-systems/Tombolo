'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('job', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      author: Sequelize.STRING,
      contact: Sequelize.STRING,
      description: Sequelize.TEXT,
      ecl: Sequelize.TEXT,
      entryBWR: Sequelize.STRING,
      gitRepo: Sequelize.STRING,
      jobType: Sequelize.STRING,
      title: Sequelize.STRING,
      name: Sequelize.STRING,
      scriptPath: Sequelize.STRING,
      sprayFileName: Sequelize.STRING,
      sprayDropZone: Sequelize.STRING,
      sprayedFileScope: Sequelize.STRING,
      metaData: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      cluster_id: {
        type: Sequelize.UUID,
        references: {
          model: 'cluster',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      application_id: {
        type: Sequelize.UUID,
        references: {
          model: 'application',
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
    return queryInterface.dropTable('job');
  },
};
