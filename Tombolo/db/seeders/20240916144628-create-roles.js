'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  // eslint-disable-next-line no-unused-vars
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'role_types',
      [
        {
          id: uuidv4(),
          roleName: 'owner',
          description: 'Owner role with full permissions',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          roleName: 'administrator',
          description: 'Administrator role with high-level permissions',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          roleName: 'contributor',
          description: 'Contributor role with permissions to add content',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          roleName: 'reader',
          description: 'Reader role with permissions to view content',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'role_types',
      {
        roleName: ['owner', 'administrator', 'contributor', 'reader'],
      },
      {}
    );
  },
};
