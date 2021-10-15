'use strict';
var uuidv4  = require('uuid/v4');

module.exports = {
  up: (queryInterface, Sequelize) => {

      return queryInterface.bulkInsert('rules', [{
        id       : uuidv4(),
        name     : 'Date Validate',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        id       : uuidv4(),
        name     : 'Phone Validate',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        id       : uuidv4(),
        name     : 'Integer Validate',
        createdAt: new Date(),
        updatedAt: new Date()
      },{
        id: uuidv4(),
        name : 'Not Empty',
        createdAt : new Date(),
        updatedAt : new Date()
      },{
        id: uuidv4(),
        name : 'Assert',
        createdAt : new Date(),
        updatedAt : new Date()
      }], {});

  },

  down: (queryInterface, Sequelize) => {
  }
};
