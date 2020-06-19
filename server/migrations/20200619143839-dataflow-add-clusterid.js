'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'dataflow',
      'clusterId', Sequelize.STRING, {
         after: 'output'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'dataflow',
      'clusterId'
    );
  }
};