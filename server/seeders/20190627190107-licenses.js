'use strict';
var uuidv4  = require('uuid/v4');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('license', [{
      id: uuidv4(),
      name : 'Apache 2.0',
      url : 'https://www.apache.org/licenses/LICENSE-2.0.html',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'DPPA',
      url : 'http://www.accessreports.com/statutes/DPPA1.htm',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'GLBA',
      url : 'https://www.fdic.gov/regulations/compliance/manual/8/viii-1.1.pdf',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'MIT',
      url : 'https://en.wikipedia.org/wiki/MIT_License',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'FCRA',
      url : 'https://www.ftc.gov/system/files/545a_fair-credit-reporting-act-0918.pdf',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'PCI',
      url : 'https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard',
      createdAt : new Date(),
      updatedAt : new Date()
    }], {});

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('license', null, {});
  }
};
