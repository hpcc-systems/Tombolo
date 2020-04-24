'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'file_instance',
      'title', Sequelize.STRING, {
         after: 'application_id'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'file_instance',
      'title'
    );
  }
};