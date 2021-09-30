'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('file', 'name', { type: Sequelize.STRING(500) })
    ]);
  },


  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('file', 'name', { type: Sequelize.STRING})
    ]);
  }
};
