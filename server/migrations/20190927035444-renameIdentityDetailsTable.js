'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
    queryInterface.renameTable('identity_details', 'data_types')
    ])
  }
};
