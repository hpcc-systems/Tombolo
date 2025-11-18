'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('work_units', {
      wuId: {
        primaryKey: true,
        type: Sequelize.STRING(30), // TODO: Will workunit ids ever get this big?
      },
      clusterId: {
        primaryKey: true,
        type: Sequelize.UUID,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      workUnitTimestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      owner: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      engine: {
        // TODO: Should this be engine? There will be a collision error between cluster and the cluster model
        allowNull: false,
        type: Sequelize.STRING,
      },
      jobName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      // TODO: Should we take state string or state ID for storage reduction.
      stateId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      protected: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      // TODO: Should we take action string or action ID for storage reduction.
      action: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      actionEx: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isPausing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      thorLcr: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      totalClusterTime: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      // TODO: Do we want application values?
      executeCost: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      fileAccessCost: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      compileCost: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      totalCost: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      detailsFetchedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      clusterDeleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // TODO: Does noAccess matter
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

    // Add indexes from the model
    await queryInterface.addIndex('work_units', ['workUnitTimestamp'], {
      name: 'work_units_timestamp_idx',
    });

    await queryInterface.addIndex(
      'work_units',
      ['clusterId', 'workUnitTimestamp'],
      {
        name: 'work_units_cluster_timestamp_idx',
      }
    );

    await queryInterface.addIndex('work_units', ['owner'], {
      name: 'work_units_owner_idx',
    });

    await queryInterface.addIndex('work_units', ['state'], {
      name: 'work_units_state_idx',
    });

    await queryInterface.addIndex('work_units', ['detailsFetchedAt'], {
      name: 'work_units_details_fetched_idx',
    });
  },

  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex(
      'work_units',
      'work_units_details_fetched_idx'
    );
    await queryInterface.removeIndex('work_units', 'work_units_state_idx');
    await queryInterface.removeIndex('work_units', 'work_units_owner_idx');
    await queryInterface.removeIndex(
      'work_units',
      'work_units_cluster_timestamp_idx'
    );
    await queryInterface.removeIndex('work_units', 'work_units_timestamp_idx');

    // Drop table
    await queryInterface.dropTable('work_units');
  },
};
