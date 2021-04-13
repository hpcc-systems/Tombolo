'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('assets_dataflows', 'cron', {
      type: Sequelize.STRING(64),
      allowNull: true,
      after: 'dataflowId'
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('assets_dataflows', 'cron');
  }
};