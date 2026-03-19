'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('integrations', [
      {
        id: uuidv4(),
        name: 'HPCC-Tools',
        description:
          'This integration enables HPCC Tools features in Tombolo, including automatic syncing of the hpcc-tools repository and access to HPCC Tools documentation',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(
      'integrations',
      { name: 'HPCC-Tools' },
      {}
    );
  },
};
