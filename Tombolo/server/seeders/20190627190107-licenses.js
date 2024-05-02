'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('license', [{
      id: uuidv4(),
      name : 'U.S. Government Works',
      url : 'https://www.usa.gov/government-works',
      description: '',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'DPPA',
      url : 'http://www.accessreports.com/statutes/DPPA1.htm',
      description: 'Nonpublic personal information including an individual’s name, address, telephone number, social security number, photograph, and medical or disability information',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'GLBA',
      url : 'https://www.fdic.gov/regulations/compliance/manual/8/viii-1.1.pdf',
      description: 'Nonpublic personal information including an individual\'s name, address, telephone number, social security number, income, credit score',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'Creative Commons Attribution License',
      description: 'Allows re-distribution and re-use of a licensed work on the condition that the creator is appropriately credited',
      url : 'http://opendefinition.org/licenses/cc-by/',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'FCRA',
      url : 'https://www.ftc.gov/system/files/545a_fair-credit-reporting-act-0918.pdf',
      description: 'Criminal history, Employment and education verifications, motor vehicle reports, health care sanctions and professional licenses',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'PCI',
      url : 'https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard',
      description: 'Credeit Card data',
      createdAt : new Date(),
      updatedAt : new Date()
    }], {});

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('license', null, {});
  }
};
 