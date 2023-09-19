"use strict";
module.exports = (sequelize, DataTypes) => {
  const plugins = sequelize.define(
    "plugins",
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
  plugins.associate = function (models) {
    // Define association here
    plugins.belongsTo(models.application, {
      foreignKey: "application_id",
    });
    plugins.hasMany(models.monitoring_notifications, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
  };
  return plugins;
};
