'use strict';
module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      // defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: true
    },
    username: DataTypes.STRING,
    hash: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    role: DataTypes.STRING
  }, {freezeTableName: true});
  user.associate = function(models) {
    // associations can be defined here
  };
  return user;
};