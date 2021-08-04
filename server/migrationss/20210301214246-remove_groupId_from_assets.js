'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'file',
        'groupId',
        Sequelize.UUID
      ),
      queryInterface.removeColumn(
        'job',
        'groupId',
        Sequelize.UUID
      ),
      queryInterface.removeColumn(
        'indexes',
        'groupId',
        Sequelize.UUID
      ),
      queryInterface.removeColumn(
        'query',
        'groupId',
        Sequelize.UUID
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('file','groupId'),
      queryInterface.addColumn('job','groupId'),
      queryInterface.addColumn('indexes','groupId'),
      queryInterface.addColumn('query','groupId')
    ]);
  }
};