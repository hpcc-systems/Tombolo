'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('file_layout', 'isSPII', 'isPCI')
  }
};