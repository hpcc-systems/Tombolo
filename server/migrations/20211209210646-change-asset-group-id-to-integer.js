'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn(
        'file',
        'groupId',
        Sequelize.INTEGER
      ),
      queryInterface.changeColumn(
        'job',
        'groupId',
        Sequelize.INTEGER
      ),
      queryInterface.changeColumn(
        'indexes',
        'groupId',
        Sequelize.INTEGER
      ),
      queryInterface.changeColumn(
        'query',
        'groupId',
        Sequelize.INTEGER
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('file', 'groupId', {
        type: Sequelize.UUID
      }),
      queryInterface.changeColumn('job', 'groupId', {
        type: Sequelize.UUID
      }),
      queryInterface.changeColumn('indexes', 'groupId', {
        type: Sequelize.UUID
      }),
      queryInterface.changeColumn('query', 'groupId', {
        type: Sequelize.UUID
      })
    ]);
  }
};