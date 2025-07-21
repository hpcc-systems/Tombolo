"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "constraint",
      [
        {
          id: uuidv4(),
          name: "CU",
          short_description: "CU",
          description: "CU",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          name: "CN",
          short_description: "CN",
          description: "CN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          name: "BR",
          short_description: "BR",
          description: "BR",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          name: "BE",
          short_description: "BE",
          description: "BE",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("constraint", null, {});
  },
};
