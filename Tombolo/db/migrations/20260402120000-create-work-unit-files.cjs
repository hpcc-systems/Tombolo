'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('work_unit_files', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      wuId: {
        allowNull: false,
        type: Sequelize.STRING(30),
      },
      clusterId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      fileName: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      fileType: {
        allowNull: false,
        type: Sequelize.ENUM('input', 'output'),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addConstraint('work_unit_files', {
      fields: ['wuId', 'clusterId'],
      type: 'foreign key',
      name: 'work_unit_files_workunit_fk',
      references: {
        table: 'work_units',
        fields: ['wuId', 'clusterId'],
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.addIndex('work_unit_files', ['clusterId', 'wuId'], {
      name: 'work_unit_files_cluster_wu_idx',
    });
  },

  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('work_unit_files');
  },
};
