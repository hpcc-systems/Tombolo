'use strict';
module.exports = (sequelize, DataTypes) => {
  const user_application = sequelize.define('user_application', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    user_id: DataTypes.STRING,
    application_id: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  user_application.associate = function(models) {
    // associations can be defined here
  };
  return user_application;
};