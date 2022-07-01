'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('file', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      title: Sequelize.STRING,
      name: Sequelize.STRING(500),
      description: Sequelize.TEXT,
      fileType: Sequelize.STRING,
      isSuperFile: Sequelize.BOOLEAN,
      serviceURL: Sequelize.STRING,
      qualifiedPath: Sequelize.STRING,
      consumer: Sequelize.STRING,
      supplier: Sequelize.STRING,
      owner: Sequelize.STRING,
      scope: Sequelize.STRING(500),
      metaData: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
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
      cluster_id: {
        type: Sequelize.UUID,
        references: {
          model: 'cluster',
          key: 'id',
        },
        onUpdate: 'NO ACTION',
        onDelete: 'NO ACTION',
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
    return queryInterface.dropTable('file');
  },
};
