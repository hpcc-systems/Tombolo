'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
    queryInterface.renameColumn('controls_regulations', 'identity_details', 'data_types')
  ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
    queryInterface.renameColumn('controls_regulations', 'data_types', 'identity_details')
    ])
  }
};
