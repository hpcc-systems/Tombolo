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
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      wuId: {
        type: Sequelize.STRING(30),
        allowNull: false,
        references: {
          model: 'work_units',
          key: 'wuId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
    // Remove indexes first
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
