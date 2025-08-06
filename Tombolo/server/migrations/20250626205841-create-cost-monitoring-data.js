'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cost_monitoring_data', {
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
      analyzed: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      notificationSentDate: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      metaData: {
        allowNull: true,
        type: Sequelize.JSON,
      },
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

    // await queryInterface.addIndex('cost_monitoring_data', {
    //   unique: true,
    //   fields: ['monitoringId', 'applicationId', 'clusterId', 'analyzed'],
    //   name: 'costMonitoringData_unique_monitoring_app_cluster_analyzed',
    // });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cost_monitoring_data');
  },
};
