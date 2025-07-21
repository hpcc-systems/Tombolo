'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('indexes', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      title: Sequelize.STRING,
      name: Sequelize.STRING,
      description: Sequelize.TEXT,
      primaryService: Sequelize.STRING,
      backupService: Sequelize.STRING,
      qualifiedPath: Sequelize.STRING,
      registrationTime: Sequelize.STRING,
      updatedDateTime: Sequelize.STRING,
      dataLastUpdatedTime: Sequelize.STRING,
      parentFileId: {
        type: Sequelize.UUID,
        references: {
          model: 'file',
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
    return queryInterface.dropTable('indexes');
  },
};
