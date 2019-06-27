'use strict';
var bcrypt = require('bcryptjs');
var uuidv4  = require('uuid/v4');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('user', [{
      id: uuidv4(),
      firstName : 'admin',
      lastName : 'admin',
      username : 'admin',
      hash: bcrypt.hashSync(process.env.APP_ADMIN_PASSWORD, 10),
      role:'admin',
      createdAt : new Date(),
      updatedAt : new Date()
    }], {});
  },

  down: (queryInterface, Sequelize) => {
  }
};
