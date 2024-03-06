"use strict";
const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "asr_monitoring_type_to_domains_relation",
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
        },
        monitoring_type_id: {
          type: DataTypes.UUID,
          references: {
            model: "monitoring_types",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        domain_id: {
          type: DataTypes.UUID,
          references: {
            model: "asr_domains",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        createdAt: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          allowNull: true,
          type: DataTypes.DATE,
        },
        deletedAt: {
          allowNull: true,
          type: DataTypes.DATE,
        },
        createdBy: {
          allowNull: false,
          type: DataTypes.JSON,
          defaultValue: { name: "system", email: "NA" },
        },
        updatedBy: {
          allowNull: true,
          type: DataTypes.JSON,
        },
        deletedBy: {
          allowNull: true,
          type: DataTypes.JSON,
        },
      }
    );

    await queryInterface.addConstraint(
      "asr_monitoring_type_to_domains_relation",
      {
        fields: ["monitoring_type_id", "domain_id"],
        type: "unique",
        name: "monitoring_type_domain_unique_constraint",
      }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("asr_monitoring_type_to_domains_relation");
  },
};
