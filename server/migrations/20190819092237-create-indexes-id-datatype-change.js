'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
    .changeColumn('indexes', 'id', {
      type: Sequelize.STRING(500)
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface
    .changeColumn('indexes', 'id', {
      type: Sequelize.UUID
    });
  }
};
