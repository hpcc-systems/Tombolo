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
      applicationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      monitoringId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cost_monitorings',
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
      analyzed: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
      'monitoringId',
    ]);
    await queryInterface.addIndex('cost_monitoring_data_archive', [
      'applicationId',
    ]);
    await queryInterface.addIndex('cost_monitoring_data_archive', [
      'clusterId',
    ]);
    await queryInterface.addIndex('cost_monitoring_data_archive', ['date']);

    // Composite index for common queries
    await queryInterface.addIndex('cost_monitoring_data_archive', {
      fields: ['monitoringId', 'applicationId', 'clusterId'],
      name: 'idx_cost_monitoring_data_archive_composite',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cost_monitoring_data_archive');
  },
};
