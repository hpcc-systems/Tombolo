'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Widen scopeType ENUM to include 'global' and 'workflow', and allow NULL
    // for scopes that have an empty/unknown scope type.
    await queryInterface.changeColumn('work_unit_details', 'scopeType', {
      type: Sequelize.ENUM(
        'activity',
        'subgraph',
        'graph',
        'operation',
        'global',
        'workflow'
      ),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove rows that would violate the old constraint before reverting
    await queryInterface.sequelize.query(
      `DELETE FROM work_unit_details WHERE scopeType IN ('global', 'workflow') OR scopeType IS NULL`
    );
    await queryInterface.changeColumn('work_unit_details', 'scopeType', {
      type: Sequelize.ENUM('activity', 'subgraph', 'graph', 'operation'),
      allowNull: false,
    });
  },
};
