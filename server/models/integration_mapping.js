"use strict";
module.exports = (sequelize, DataTypes) => {
  const IntegrationMapping = sequelize.define(
    "integration_mapping",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      integration_id: {
        type: DataTypes.UUID,
        references: {
          model: "integrations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      application_id: {
        type: DataTypes.UUID,
        references: {
          model: "application",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    { freezeTableName: true }
  );

  IntegrationMapping.associate = (models) => {
    IntegrationMapping.belongsTo(models.integrations, {
      foreignKey: "integration_id",
    });
    IntegrationMapping.belongsTo(models.application, {
      foreignKey: "application_id",
    });
  };

  return IntegrationMapping;
};
