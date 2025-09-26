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
      localDay: {
        type: Sequelize.DATEONLY,
        comment: 'Precomputed local day for fast queries',
      },
      usersCostInfo: {
        allowNull: false,
        type: Sequelize.JSON,
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

    // Composite index for fast queries by cluster, local_day, and deletedAt
    await queryInterface.addIndex(
      'cost_monitoring_data',
      ['clusterId', 'local_day', 'deletedAt'],
      {
        name: 'idx_cmd_cluster_localday_notdeleted',
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cost_monitoring_data');
  },
};
