'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'dataflow',
      'type', Sequelize.STRING, {
         after: 'clusterId'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'dataflow',
      'type'
    );
  }
};