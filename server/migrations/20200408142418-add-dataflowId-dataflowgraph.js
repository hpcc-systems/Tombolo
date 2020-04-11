'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'dataflowgraph',
      'dataflowId', Sequelize.UUID, {
         after: 'id'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'dataflowgraph',
      'dataflowId'
    );
  }
};