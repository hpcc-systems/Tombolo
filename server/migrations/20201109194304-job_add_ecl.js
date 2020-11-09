'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Job', 'ecl', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'description'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Job', 'ecl');
  }
};