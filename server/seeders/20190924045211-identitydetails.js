'use strict';
var uuidv4  = require('uuid/v4');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('identity_details', [{
      id: uuidv4(),
      name : 'Drivers License',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'Credit Card',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'PHI',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'SSN',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'DOB',
      createdAt : new Date(),
      updatedAt : new Date()
    }], {});

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('identity_details', null, {});
  }
};
