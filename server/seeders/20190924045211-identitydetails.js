'use strict';
var uuidv4  = require('uuid/v4');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('data_types', [{
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
    },
    {
      id: uuidv4(),
      name : 'Policy Number',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'Zipcode',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'Medical Record Number',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'License Number',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'IP Addresses',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'Phone Number',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'Address',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'Name',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'Passport Number',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'Login Details',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'Email Address',
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      id: uuidv4(),
      name : 'Other Unique Identifiers',
      createdAt : new Date(),
      updatedAt : new Date()
    }], {});

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('data_types', null, {});
  }
};
