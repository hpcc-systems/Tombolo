'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'file',
        'groupId',
        Sequelize.UUID
      ),
      queryInterface.addColumn(
        'job',
        'groupId',
        Sequelize.UUID
      ),
      queryInterface.addColumn(
        'indexes',
        'groupId',
        Sequelize.UUID
      ),
      queryInterface.addColumn(
        'query',
        'groupId',
        Sequelize.UUID
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('file','groupId'),
      queryInterface.removeColumn('job','groupId'),
      queryInterface.removeColumn('indexes','groupId'),
      queryInterface.removeColumn('query','groupId')
    ]);
  }
};