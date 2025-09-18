'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cost_monitoring_data_archive', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      clusterId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      usersCostInfo: {
        allowNull: false,
        type: Sequelize.JSON,
      },
      metaData: {
        allowNull: true,
        type: Sequelize.JSON,
      },
      archivedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When this record was archived',
      },
      // Standard timestamps
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('cost_monitoring_data_archive', [
      'archivedAt',
    ]);
    await queryInterface.addIndex('cost_monitoring_data_archive', [
      'clusterId',
    ]);
    await queryInterface.addIndex('cost_monitoring_data_archive', ['date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cost_monitoring_data_archive');
  },
};
