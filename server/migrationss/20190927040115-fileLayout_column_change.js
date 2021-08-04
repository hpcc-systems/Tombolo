'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
    queryInterface.renameColumn('file_layout', 'identityDetail', 'data_types')
  ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
    queryInterface.renameColumn('file_layout', 'data_types', 'identityDetail')
    ])
  }
};
