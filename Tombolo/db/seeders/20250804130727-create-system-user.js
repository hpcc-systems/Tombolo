'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        firstName: 'System',
        lastName: 'User',
        email: 'system-user@example.com',
        hash: '',
        registrationMethod: 'traditional',
        verifiedUser: false,
        registrationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'users',
      {
        firstName: 'System',
        lastName: 'User',
        email: 'system-user@example.com',
      },
      {}
    );
  },
};
