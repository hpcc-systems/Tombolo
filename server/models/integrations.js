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
        unique: false,
      },
      description: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: false,
      },
      active: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      config: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      application_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
    },
    { freezeTableName: true }
  );
  integrations.associate = function (models) {
    // Define association here
    integrations.belongsTo(models.application, {
      foreignKey: "application_id",
    });
    integrations.hasMany(models.monitoring_notifications, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
  };
  return integrations;
};
