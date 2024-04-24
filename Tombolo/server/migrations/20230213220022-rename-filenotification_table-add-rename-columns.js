"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .renameTable("monitoring_notifications", "monitoring_notifications")
      .then(() => {
        return queryInterface.addColumn(
          "monitoring_notifications",
          "monitoring_type",
          {
            type: Sequelize.STRING,
            after: "id",
          }
        );
      })
      .then(() => {
        return queryInterface.renameColumn(
          "monitoring_notifications",
          "filemonitoring_id",
          "monitoring_id"
        );
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface
      .renameColumn(
        "monitoring_notifications",
        "monitoring_id",
        "filemonitoring_id"
      )
      .then(() => {
        return queryInterface.removeColumn(
          "monitoring_notifications",
          "monitoring_type"
        );
      })
      .then(() => {
        return queryInterface.renameTable(
          "monitoring_notifications",
          "monitoring_notifications"
        );
      });
  },
};
