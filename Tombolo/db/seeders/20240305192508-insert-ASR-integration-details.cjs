'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('integrations', [
      {
        id: uuidv4(),
        name: 'ASR',
        description:
          'This integration enables ASR-related features in Tombolo and facilitates connections to Orbit servers, enhancing user capabilities and data accessibility',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('integrations', null, {});
  },
};
