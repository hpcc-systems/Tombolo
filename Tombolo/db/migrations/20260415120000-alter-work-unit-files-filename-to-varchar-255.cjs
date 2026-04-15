'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('work_unit_files', 'fileName', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('work_unit_files', 'fileName', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
};
