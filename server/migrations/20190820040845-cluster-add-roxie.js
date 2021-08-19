'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
      'cluster','roxie_host', Sequelize.STRING),
      queryInterface.addColumn(
        'cluster','roxie_port', Sequelize.STRING)
    ]);},

  down: (queryInterface, Sequelize) => {
    return Promise.all([
       queryInterface.removeColumn(
      'cluster','roxie_host'),
    queryInterface.removeColumn(
      'cluster','roxie_port')
  ]);}
};