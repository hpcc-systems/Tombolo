'use strict';
module.exports = (sequelize, DataTypes) => {
  const application = sequelize.define('application', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    title: DataTypes.STRING,
    description: DataTypes.STRING
  }, {freezeTableName: true});
  application.associate = function(models) {
    // associations can be defined here
  };
  return application;
};