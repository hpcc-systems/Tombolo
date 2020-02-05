'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
    queryInterface.renameColumn('file', 'primaryService', 'serviceUrl'),
    queryInterface.removeColumn('file', 'backupService')
  ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('file_layout', 'serviceUrl', 'primaryService'),
      queryInterface.addColumn('file', 'backupService', Sequelize.STRING, {
         after: 'serviceUrl'
      })
    ])
  }
};
