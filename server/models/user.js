'use strict';
module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    hash: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    role: DataTypes.STRING,
    type: DataTypes.STRING
  }, {freezeTableName: true});
  user.associate = function(models) {
    // associations can be defined here
  };
  return user;
};