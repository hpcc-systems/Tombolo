'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
    queryInterface.renameColumn('cluster', 'host_url', 'thor_host'),
    queryInterface.renameColumn('cluster', 'port', 'thor_port')
  ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
    queryInterface.renameColumn('cluster', 'thor_host', 'host_url'),
    queryInterface.renameColumn('cluster', 'thor_port', 'port')
    ])
  }
};
