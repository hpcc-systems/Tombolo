'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('costMonitoringDataArchive', {
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
          model: 'application',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      clusterId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cluster',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      monitoringId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'costMonitoring',
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
    await queryInterface.addIndex('costMonitoringDataArchive', ['archivedAt']);
    await queryInterface.addIndex('costMonitoringDataArchive', [
      'monitoringId',
    ]);
    await queryInterface.addIndex('costMonitoringDataArchive', [
      'applicationId',
    ]);
    await queryInterface.addIndex('costMonitoringDataArchive', ['clusterId']);
    await queryInterface.addIndex('costMonitoringDataArchive', ['date']);

    // Composite index for common queries
    await queryInterface.addIndex('costMonitoringDataArchive', {
      fields: ['monitoringId', 'applicationId', 'clusterId'],
      name: 'idx_cost_monitoring_data_archive_composite',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('costMonitoringDataArchive');
  },
};
