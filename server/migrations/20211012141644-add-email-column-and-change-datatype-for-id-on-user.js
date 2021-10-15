'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('user', 'email', {
        type: Sequelize.STRING,
      }),
      queryInterface.changeColumn('user', 'id', {
        type: Sequelize.INTEGER,
        primaryKey : true,
        autoIncrement: true,
        initialAutoIncrement: 1
      }),
      queryInterface.addColumn('user', 'type', {
        type: Sequelize.STRING,
      })
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('user', 'email'),
      queryInterface.changeColumn('user', 'id', {
        type: Sequelize.STRING
      }),
      queryInterface.removeColumn('user', 'type'),
    ])
  }
};
