'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('work_unit_details', 'fileName', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('work_unit_details', 'WhenK8sLaunched', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('work_unit_details', 'WhenK8sStarted', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('work_unit_details', 'CostExecute', {
      type: Sequelize.DECIMAL(14, 6),
      allowNull: true,
    });

    await queryInterface.addColumn('work_unit_details', 'CostFileAccess', {
      type: Sequelize.DECIMAL(14, 6),
      allowNull: true,
    });

    await queryInterface.addColumn('work_unit_details', 'CostCompile', {
      type: Sequelize.DECIMAL(14, 6),
      allowNull: true,
    });

    await queryInterface.addColumn('work_unit_details', 'CostSavingPotential', {
      type: Sequelize.DECIMAL(14, 6),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'work_unit_details',
      'CostSavingPotential'
    );
    await queryInterface.removeColumn('work_unit_details', 'CostCompile');
    await queryInterface.removeColumn('work_unit_details', 'CostFileAccess');
    await queryInterface.removeColumn('work_unit_details', 'CostExecute');

    await queryInterface.removeColumn('work_unit_details', 'WhenK8sStarted');
    await queryInterface.removeColumn('work_unit_details', 'WhenK8sLaunched');

    await queryInterface.changeColumn('work_unit_details', 'fileName', {
      type: Sequelize.STRING(130),
      allowNull: true,
    });
  },
};
