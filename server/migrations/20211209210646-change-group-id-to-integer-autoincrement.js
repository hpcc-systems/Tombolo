'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('groups', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('groups', 'id', {
      type: Sequelize.UUID,
      autoIncrement: false
    })
  }
};