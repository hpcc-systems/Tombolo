'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('work_units', 'endTimestamp', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('work_units', 'savingPotential', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.removeColumn('work_units', 'stateId');
    await queryInterface.removeColumn('work_units', 'action');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('work_units', 'action', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.addColumn('work_units', 'stateId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.removeColumn('work_units', 'savingPotential');
    await queryInterface.removeColumn('work_units', 'endTimestamp');
  },
};
