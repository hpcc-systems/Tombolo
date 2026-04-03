'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.renameColumn(
      'work_units',
      'exceptionsFetchedAt',
      'infoFetchedAt'
    );

    await queryInterface.removeIndex(
      'work_units',
      'work_units_exceptions_fetched_idx'
    );

    await queryInterface.addIndex('work_units', ['infoFetchedAt'], {
      name: 'work_units_info_fetched_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'work_units',
      'work_units_info_fetched_idx'
    );

    await queryInterface.renameColumn(
      'work_units',
      'infoFetchedAt',
      'exceptionsFetchedAt'
    );

    await queryInterface.addIndex('work_units', ['exceptionsFetchedAt'], {
      name: 'work_units_exceptions_fetched_idx',
    });
  },
};
