'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('work_unit_exceptions', {
      wuId: {
        primaryKey: true,
        type: Sequelize.STRING(30),
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
      sequenceNo: {
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      severity: {
        type: Sequelize.STRING(20),
      },
      source: {
        allowNull: true,
        type: Sequelize.STRING(40),
      },
      code: {
        type: Sequelize.INTEGER,
      },
      message: {
        allowNull: true,
        type: Sequelize.STRING(200),
      },
      column: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      lineNo: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      fileName: {
        allowNull: true,
        type: Sequelize.STRING(210),
      },
      activity: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      scope: {
        allowNull: true,
        type: Sequelize.STRING(210),
      },
      priority: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      cost: {
        allowNull: true,
        type: Sequelize.FLOAT,
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

    await queryInterface.addConstraint('work_unit_exceptions', {
      fields: ['wuId', 'clusterId'],
      type: 'foreign key',
      name: 'work_unit_exceptions_workunit_fk',
      references: {
        table: 'work_units',
        fields: ['wuId', 'clusterId'],
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  // eslint-disable-next-line
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('work_unit_exceptions');
  },
};
