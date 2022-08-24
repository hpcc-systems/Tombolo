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
          nature: "CU",
          source: "CU",
          scope: "CU",
          permissible_purposes: "CU",
          description: "CU",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          name: "CN",
          nature: "CN",
          source: "CN",
          scope: "CN",
          permissible_purposes: "CN",
          description: "CN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          name: "BR",
          nature: "BR",
          source: "BR",
          scope: "BR",
          permissible_purposes: "BR",
          description: "BR",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          name: "BE",
          nature: "BE",
          source: "BE",
          scope: "BE",
          permissible_purposes: "BE",
          description: "BE",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  down: (queryInterface, Sequelize) => {},
};
