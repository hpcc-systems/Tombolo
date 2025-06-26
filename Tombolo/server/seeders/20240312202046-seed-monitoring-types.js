'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('monitoring_types', [
      {
        id: uuidv4(),
        name: 'Job Monitoring',
        createdAt: new Date(),
        createdBy: JSON.stringify({
          firstName: null,
          lastName: 'System',
          email: 'NA',
        }),
      },
      {
        id: uuidv4(),
        name: 'Directory Monitoring',
        createdAt: new Date(),
        createdBy: JSON.stringify({
          firstName: null,
          lastName: 'System',
          email: 'NA',
        }),
      },
      {
        id: uuidv4(),
        name: 'Cost Monitoring',
        createdAt: new Date(),
        createdBy: JSON.stringify({
          firstName: null,
          lastName: 'System',
          email: 'NA',
        }),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('monitoring_types', null, {});
  },
};
