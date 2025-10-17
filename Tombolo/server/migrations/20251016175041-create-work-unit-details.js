'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('work_unit_details', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      clusterId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      wuId: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      scopeId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      scopeName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      scopeType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      properties: {
        type: Sequelize.JSON,
        allowNull: true,
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

    // Add foreign key constraints
    await queryInterface.addConstraint('work_unit_details', {
      fields: ['clusterId'],
      type: 'foreign key',
      name: 'work_unit_details_cluster_fk',
      references: {
        table: 'clusters',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('work_unit_details', {
      fields: ['wuId', 'clusterId'],
      type: 'foreign key',
      name: 'work_unit_details_workunit_fk',
      references: {
        table: 'work_units',
        fields: ['wuId', 'clusterId'],
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // Add indexes
    await queryInterface.addIndex('work_unit_details', ['clusterId', 'wuId'], {
      name: 'work_unit_details_cluster_wu_idx',
    });

    await queryInterface.addIndex('work_unit_details', ['scopeType'], {
      name: 'work_unit_details_scope_type_idx',
    });

    await queryInterface.addIndex('work_unit_details', ['scopeName'], {
      name: 'work_unit_details_scope_name_idx',
    });

    await queryInterface.addIndex('work_unit_details', ['scopeId'], {
      name: 'work_unit_details_scope_id_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraints first
    await queryInterface.removeConstraint(
      'work_unit_details',
      'work_unit_details_workunit_fk'
    );
    await queryInterface.removeConstraint(
      'work_unit_details',
      'work_unit_details_cluster_fk'
    );

    // Remove indexes
    await queryInterface.removeIndex(
      'work_unit_details',
      'work_unit_details_scope_id_idx'
    );
    await queryInterface.removeIndex(
      'work_unit_details',
      'work_unit_details_scope_name_idx'
    );
    await queryInterface.removeIndex(
      'work_unit_details',
      'work_unit_details_scope_type_idx'
    );
    await queryInterface.removeIndex(
      'work_unit_details',
      'work_unit_details_cluster_wu_idx'
    );

    // Drop table
    await queryInterface.dropTable('work_unit_details');
  },
};
