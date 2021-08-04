'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
    queryInterface.renameTable('workflowgraph', 'dataflowgraph'),
  ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameTable('dataflowgraph', 'workflowgraph'),
    ])
  }
};
