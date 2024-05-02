"use strict";
module.exports = (sequelize, DataTypes) => {
  const integrations = sequelize.define(
    "integrations",
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      description: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      metaData:{
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    { freezeTableName: true }
  );
// Association to integration_mapping
  integrations.associate = (models) => {
    integrations.hasMany(models.integration_mapping, {
      foreignKey: "integration_id",
    });
  };
  return integrations;
};
